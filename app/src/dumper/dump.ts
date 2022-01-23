import { ChannelLogsQueryOptions, Client, Intents, Message, TextChannel } from 'discord.js';
import * as fs from 'fs';
import { API_MAX_MESSAGES_LIMIT, DATA_DIR, DISCORD_API_KEY, GUILD_ID, loadMeatadata, MAX_MESSAGES_PER_CHANNEL, MESSAGE_POSTFIX, MESSAGE_PREFIX, MetadataMap, METADATA_FILE, Mode, SAMPLE_CHANNELS, writeMetadata } from '../common';
import { Dumper, DumperConstructor } from './dumper';
import { SingleUserDumper } from './dumpers/single_user_dumper';
import { ThreadDumper } from './dumpers/thread_dumper';

let MODE: Mode = Mode.THREADS;

const DUMPER_MAP: { [M in Mode]: DumperConstructor } = {
  [Mode.SINGLE_USER]: SingleUserDumper,
  [Mode.THREADS]: ThreadDumper,
};

async function fetchChannelMessages(channel: TextChannel): Promise<Message[]> {
  let lastId: string | null = null;

  const messages: Message[] = [];

  for (let i = 0; i < MAX_MESSAGES_PER_CHANNEL / API_MAX_MESSAGES_LIMIT; i++) {
    const options: ChannelLogsQueryOptions = {
      limit: API_MAX_MESSAGES_LIMIT,
    }

    if (lastId !== null) {
      options['before'] = lastId;
    }

    try {
      const serverMessages = await channel.messages.fetch(options);

      for (const message of serverMessages.values()) {
        messages.push(message);
        lastId = message.id;
      }
      console.log(`Fetched ${messages.length} messages from #${channel.name}...`);

      if (serverMessages.size !== API_MAX_MESSAGES_LIMIT) {
        break;
      }
    }
    catch (e) {
      console.error('Unable to read messages from ' + channel.name, e);
      break;
    }
  }

  console.log(`Fetched ${messages.length} total messages from #${channel.name}!`);
  return messages;
}

async function readChannelMessages(channel: TextChannel, dumper: Dumper) {
  const messages = await fetchChannelMessages(channel);
  await dumper.processMessages(channel, messages);
}

function writeResults(data: { [entry: string]: string[] }, metadata: MetadataMap) {
  // Write out results
  for (const [entryId, entries] of Object.entries(data)) {
    const file = `${DATA_DIR}/${entryId}_messages.txt`;
    // Prefix/suffix each entry
    const fixedEntries = entries.map((entry) => MESSAGE_PREFIX + entry + MESSAGE_POSTFIX);
    fs.writeFileSync(file, fixedEntries.join('\n'));
    console.log(`Wrote messages ${file}`);
  }

  // Merge in existing metadata
  const existingMetadata = loadMeatadata();

  // Write new metadata
  writeMetadata({
    ...existingMetadata,
    ...metadata,
  });
  console.log(`Wrote metadata ${METADATA_FILE}`);
}

async function main() {
  try {
    const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

    await client.login(DISCORD_API_KEY);

    async function dumpMessages() {
      const readGuild = client.guilds.resolve(GUILD_ID);
      if (readGuild === null) {
        console.log(`Could not connect to guild "${GUILD_ID}"`);
        return;
      }

      const channels = [...(await readGuild.channels.fetch()).values()];

      const readChannels = channels.filter(ch =>
        ch.type === 'GUILD_TEXT'
        && SAMPLE_CHANNELS.includes(ch.name)
      ) as unknown as TextChannel[];

      const dumper = new DUMPER_MAP[MODE]();

      for (const readChannel of readChannels) {
        await readChannelMessages(readChannel, dumper);
      }

      // Finalize and allow any last-minute pruning
      dumper.finalize();

      // Serialize for writing
      const { data, metadata } = dumper.serialize();

      // Write out results
      writeResults(data, metadata);
    }

    client.on('ready', async () => {
      await dumpMessages();
      process.exit();
    });
  }
  catch (e) {
    console.log(e);
  }
}

// tslint:disable-next-line: no-floating-promises
main();
