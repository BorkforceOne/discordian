import { Message, TextChannel } from 'discord.js';
import { MetadataMap } from '../common';

export interface Dumper {
  processMessages(channel: TextChannel, messages: Message[]): Promise<void>;
  finalize(): void;
  serialize(): { data: { [entry: string]: string[] }, metadata: MetadataMap };
}

export interface DumperConstructor {
  new(): Dumper;
}
