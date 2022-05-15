import { GuildMember, Message, TextChannel } from "discord.js";
import { BANNED_STRINGS, MESSAGE_DELIMITTER, MESSAGE_POSTFIX, MESSAGE_PREFIX, MetadataMap, MIN_MESSAGES_REQUIRED, MIN_TOTAL_LENGTH_REQUIRED, USER_DENYLIST } from "../../common";
import { Dumper } from "../dumper";

export class SingleUserDumper implements Dumper {
  metadata: MetadataMap = {};
  data: { [user: string]: string[] } = {};

  private isEligableMessage(message: Message): boolean {
    if (message.type !== 'DEFAULT') {
      return false;
    }

    const user = message.member as GuildMember;

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
    for (const message of messages) {
      if (!this.isEligableMessage(message)) {
        continue;
      }

      const user = await channel.guild.members.fetch(message.author)

      const userId = user.id;

      if (!this.metadata[userId]) {
        this.metadata[userId] = {
          name: user.displayName,
          prefix: MESSAGE_PREFIX,
          postfix: MESSAGE_POSTFIX,
          delimitter: MESSAGE_DELIMITTER
        };
      }

      if (!this.data[userId]) {
        this.data[userId] = [];
      }

      this.data[userId].push(`${MESSAGE_PREFIX}${message.content}${MESSAGE_POSTFIX}`);
    }

  }

  finalize(): void {
    for (const [userId, msgs] of Object.entries(this.data)) {
      // Reverse messages since they were pushed in
      const outString = msgs.reverse().join('');
      if (msgs.length < MIN_MESSAGES_REQUIRED
        || outString.length < MIN_TOTAL_LENGTH_REQUIRED
        || USER_DENYLIST.includes(userId)) {
        console.log(`Removing ${this.metadata[userId].name} due to message requirements...`);
        delete this.metadata[userId];
        continue;
      }
    }
  }

  serialize(): { data: { [entry: string]: string[] }, metadata: MetadataMap } {
    throw new Error("Method not implemented.");
  }
}