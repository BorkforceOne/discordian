import { MessageEmbed, TextChannel } from "discord.js";
import { ALWAYS_GENERATE_NEW_MESSAGES, MetadataMap, SIMULATOR_DRY_RUN, SIMULATOR_INTERACTIVE } from "../../common";
import { networkSimulate } from "../simulation_utils";
import { Simulator } from "../simulator";
import * as inquirer from "inquirer";

interface ThreadMessage {
  userId: string;
  message: string;
}

interface Thread {
  channel: string;
  messages: ThreadMessage[];
}

export class ThreadSimulator implements Simulator {
  constructor() {
    console.log("Thread simulator started...");
  }

  async run(metadataMap: MetadataMap, outputChannel: TextChannel): Promise<void> {
    // Load related metadata
    const metadata = metadataMap["threads"];

    // Load messages / simulate
    const messages = networkSimulate("threads", metadata, ALWAYS_GENERATE_NEW_MESSAGES);

    // Parse resulting text
    const threads = this.parseThreads(messages);
    console.log(`Parsed ${threads.length} threads!`);

    // Write out threads
    for (const [index, thread] of threads.entries()) {
      await this.writeThread(thread, outputChannel);
      console.log(`Wrote thread ${index}`);
    }
  }

  async interactiveShouldShowThread(): Promise<boolean> {
    const result = (await inquirer.prompt({
      type: 'confirm',
      name: 'showThread',
      message: 'Send this thread?',
    })).showThread;

    return result;
  }

  private parseThreads(input: string): Thread[] {
    // Split the thread into messages
    const threads: Thread[] = [];
    const lines = input.split(/\r?\n/);

    let messages: ThreadMessage[] = [];
    let channel = "";
    let current: ThreadMessage = {
      message: '',
      userId: '',
    };

    // Recombine any messages
    for (const line of lines) {
      // Channel identification
      if (line.startsWith('#')) {
        if (messages.length > 0) {
          threads.push({
            channel,
            messages,
          });
          messages = [];
        }
        channel = line;
        continue;
      }

      // User message
      if (line.startsWith('[')) {
        if (current.message && current.userId) {
          messages.push(current);
        }

        const matches = line.match(/\[([0-9]+)\]: (.*)/);
        const userId = matches?.[1];
        const message = matches?.[2] ?? '';
        if (!userId) {
          continue;
        }

        // Remove duplicate lines
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          if (lastMessage.message === message && lastMessage.userId === userId) {
            messages.pop();
            continue;
          }
        }

        current = {
          userId,
          message,
        }
        continue;
      }

      // User message contents
      if (current.userId) {
        current.message += '\n' + line;
      }
    }

    if (current.message && current.userId) {
      messages.push(current);
    }

    if (messages.length > 0) {
      threads.push({
        channel,
        messages,
      });
    }

    // Split any extra long conversations into separate threads
    for (const thread of threads) {
      if (thread.messages.length > 25) {
        threads.push({
          channel: thread.channel,
          messages: thread.messages.slice(25),
        });
        thread.messages.length = 25;
      }
    }

    return threads;
  }

  private async writeThread(thread: Thread, outputChannel: TextChannel): Promise<void> {
    const channel = thread.channel;
    const messages: { name: string, value: string }[] = [];

    for (const message of thread.messages) {
      let name = message.userId;
      try {
        const member = (await outputChannel.guild.members.fetch(name));
        name = member.user.username;
      } catch (error) {
        console.error(`Could not resolve member ${name}`);
      }

      messages.push({
        name,
        value: message.message,
      });
    }
    
    console.log(`${channel}`);
    for (const message of messages) {
      console.log(`${message.name}: ${message.value}`);
    }
    console.log("#########");

    let shouldShow = true;
    if (SIMULATOR_INTERACTIVE) {
      shouldShow = await this.interactiveShouldShowThread();
    }

    if (!SIMULATOR_DRY_RUN && shouldShow) {
      const output = new MessageEmbed()
      .setColor("#0099ff")
      .setTitle(`Simulation of ${channel}`)
      .setFields(...messages)
      .setFooter({ text: "Generated using GPT-2 (Does not represent the views of any users shown here)", iconURL: 'https://thumbs.dreamstime.com/b/deep-learning-icon-industry-collection-simple-line-element-symbol-templates-web-design-infographics-175041693.jpg' });

      await outputChannel.send({ embeds: [output] });
    }
  }
}
