import { Message, TextChannel } from "discord.js";
import { BANNED_STRINGS, MESSAGE_DELIMITTER, MESSAGE_POSTFIX, MESSAGE_PREFIX, MetadataMap, USER_DENYLIST } from "../../common";
import { Dumper } from "../dumper";

// In seconds
const CONVERSTATION_PEROID = 30 * 60; // 30 minutes
const CONVERSTATION_MIN_ENTRIES = 2;

interface ThreadMessage {
  userId: string,
  text: string,
}

export class ThreadDumper implements Dumper {
  metadata: MetadataMap = {};
  buckets: Array<Array<ThreadMessage>> = [];

  constructor() {
    console.log("Thread dumper started...");
  }

  private isEligableMessage(message: Message): boolean {
    if (message.type !== 'DEFAULT') {
      return false;
    }

    const user = message.author;

    if (!user || !user.id || USER_DENYLIST.includes(user.id)) {
      return false;
    }

    if (message.content.trim().length === 0) {
      return false;
    }

    if (BANNED_STRINGS.some(bannedString => message.content.includes(bannedString))) {
      return false;
    }

    return true;
  }

  async processMessages(channel: TextChannel, messages: Message[]): Promise<void> {
    const entry = "threads";

    if (!this.metadata[entry]) {
      this.metadata[entry] = {
        name: "All discord messages",
        delimitter: MESSAGE_DELIMITTER,
        prefix: MESSAGE_PREFIX,
        postfix: MESSAGE_POSTFIX,
      };
    }

    let count = 0;

    let bucket: ThreadMessage[] = [];
    let lastTime = new Date(0);
    for (const message of messages) {
      if (!this.isEligableMessage(message)) {
        continue;
      }

      const secondsBetween = (lastTime.getTime() - message.createdAt.getTime()) / 1000;
      if (secondsBetween > CONVERSTATION_PEROID) {
        if (bucket.length >= CONVERSTATION_MIN_ENTRIES) {
          // Reverse messages since they were pushed in
          bucket.push({
            userId: "",
            text: `#${channel.name}`,
          });
          bucket.reverse();
          this.buckets.push(bucket);
        }
        bucket = [];
      }

      const userId = message.author.id;
      const text = message.content;
      lastTime = message.createdAt;
      bucket.push({
        userId,
        text,
      });

      count++;
    }
    if (bucket.length > 0) {
      // Reverse messages since they were pushed in
      bucket.push({
        userId: "",
        text: `#${channel.name}`,
      });
      bucket.reverse();
      this.buckets.push(bucket);
      bucket = [];
    }

    console.log(`Added ${count} messages, ${this.buckets.length} buckets`)
  }

  finalize(): void {
    const sizeBefore = this.buckets.length;
    this.buckets = this.buckets.filter(bucket => {
      // Ensure at least 2 different users were in each thread
      const users = new Set([...bucket.filter((message) => !!message.userId).map(message => message.userId)]);
      if (users.size === 1) {
        console.log("Dropping single-user thread...")
        return false;
      }

      return true;
    });
    console.log(`Pruned ${sizeBefore - this.buckets.length} threads.`);
  }

  serialize(): { data: { [entry: string]: string[] }, metadata: MetadataMap } {
    const entries = this.buckets.map((bucket) => bucket.map(message => this.formatThreadMessage(message)).join("\n"));

    return {
      data: {
        'threads': entries,
      },
      metadata: this.metadata,
    };
  }

  private formatThreadMessage(message: ThreadMessage): string {
    if (!message.userId) {
      return message.text;
    }
    return `[${message.userId}]: ${message.text}`;
  }
}