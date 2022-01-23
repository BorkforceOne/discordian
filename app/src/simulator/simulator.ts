import { TextChannel } from 'discord.js';
import { MetadataMap } from '../common';

export interface Simulator {
  run(metadataMap: MetadataMap, outputChannel: TextChannel): Promise<void>;
}

export interface SimulatorConstructor {
  new(): Simulator;
}
