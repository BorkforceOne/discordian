import { TextChannel } from "discord.js";
import { MetadataMap } from "../../common";
import { Simulator } from "../simulator";

export class NoopSimulator implements Simulator {
  run(metadataMap: MetadataMap, outputChannel: TextChannel): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
