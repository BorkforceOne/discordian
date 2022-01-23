import * as path from "path";
import * as fs from "fs";

export interface Metadata {
  name: string;
  prefix?: string;
  postfix?: string;
  delimitter: string;
}

export interface MetadataMap {
  [entry: string]: Metadata;
}

export const DATA_DIR = path.resolve("../data");

export const METADATA_FILE = path.resolve(DATA_DIR, "./metadata.json");
export const CONFIG_FILE = path.resolve(DATA_DIR, "./config.json");

export const MESSAGE_PREFIX = "\ue001";
export const MESSAGE_POSTFIX = "\ue002";
export const MESSAGE_DELIMITTER = "\ue000";

export enum Mode {
  SINGLE_USER, // Generate for all users
  THREADS, // Generate a threads entry
}

export const API_MAX_MESSAGES_LIMIT = 100;
export const MIN_MESSAGES_REQUIRED = 100;
export const MIN_TOTAL_LENGTH_REQUIRED = MIN_MESSAGES_REQUIRED * 70;

export function loadMeatadata(): MetadataMap|undefined {
  if (fs.existsSync(METADATA_FILE)) {
    return JSON.parse(String(fs.readFileSync(METADATA_FILE)));
  }
  return;
}

export function writeMetadata(metadataMap: MetadataMap): void {
  fs.writeFileSync(METADATA_FILE, JSON.stringify(metadataMap, null, 4));
}

function loadConfig(): any {
  if (fs.existsSync(CONFIG_FILE)) {
    return JSON.parse(String(fs.readFileSync(CONFIG_FILE)));
  }
  return;
}

const config = loadConfig();
export const SAMPLE_CHANNELS: string[] = config?.["dumper"]?.["sampleChannels"] ?? [];
export const MAX_MESSAGES_PER_CHANNEL: number = config?.["dumper"]?.["maxMessagesPerChannel"] ?? 100;
export const USER_DENYLIST: string[] = config?.["dumper"]?.["sampleChannels"] ?? [];
export const BANNED_STRINGS: string[] = config?.["dumper"]?.["bannedStrings"] ?? [];
export const ALWAYS_GENERATE_NEW_MESSAGES: boolean = config?.["simulator"]?.["alwaysGenerateNewMessages"] ?? false;
export const SIMULATOR_DRY_RUN: boolean = config?.["simulator"]?.["dryRun"] ?? true;
export const DISCORD_API_KEY: string = config?.["apiKey"] ?? "";
export const GUILD_ID: string = config?.["guildId"] ?? "";
