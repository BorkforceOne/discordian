import * as fs from 'fs';
import * as cp from 'child_process';
import * as XRegExp from 'xregexp';
import { DATA_DIR, Metadata, MetadataMap, METADATA_FILE } from "../common";

const MESSAGE_GENERATION_SAMPLE_SIZE = 1;
const UNPRINTABLE_CHARACTER_REGEX = XRegExp("\\p{Co}", "gui");

export function networkSimulate(entryId: string, metadata: Metadata, force_create: boolean): string {
    const sampleFile = `${DATA_DIR}/${entryId}_sample.txt`;
    console.log(sampleFile);
    const displayName = metadata.name;
  
    if (!fs.existsSync(sampleFile) || force_create) {
        console.log(`** Generating messages for ${entryId} (${displayName}) **`);
        cp.execSync(`set "PYTHONIOENCODING=UTF-8" & conda run -n discordian-network python simulate.py --entry=${entryId} --sample-size=${MESSAGE_GENERATION_SAMPLE_SIZE} --batch-size=${Math.min(10, MESSAGE_GENERATION_SAMPLE_SIZE)}`, {
          encoding: "utf-8",
          cwd: "../network",
        });
    }
  
    console.log(`** Loading messages for ${entryId} (${displayName}) **`);
    let messages = fs.readFileSync(sampleFile, 'utf-8');
  
    // Remove any unprintable characters
    messages = XRegExp.replace(messages, UNPRINTABLE_CHARACTER_REGEX, "");
    console.log(messages);

    return messages;
  }
  
  export function loadMetadataMap(): MetadataMap {
    const metadataData = fs.readFileSync(METADATA_FILE, 'utf-8');
    const metadataMap = JSON.parse(metadataData) as MetadataMap;
    return metadataMap;
  }
