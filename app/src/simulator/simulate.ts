import * as Discord from 'discord.js';
import { DISCORD_API_KEY, GUILD_ID, Mode, SIMULATOR_INTERACTIVE, SIMULATOR_OUTPUT_CHANNEL } from '../common';
import { loadMetadataMap } from './simulation_utils';
import { SimulatorConstructor } from './simulator';
import { NoopSimulator } from './simulators/noop_simulator';
import { ThreadSimulator } from './simulators/thread_simulator';

let MODE: Mode = Mode.THREADS;

const SIMULATOR_MAP: { [M in Mode]: SimulatorConstructor } = {
  [Mode.SINGLE_USER]: NoopSimulator,
  [Mode.THREADS]: ThreadSimulator,
};

process.on('unhandledRejection', console.log);

// tslint:disable-next-line: no-floating-promises
(async () => {
  try {
    const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });

    await client.login(DISCORD_API_KEY);
    client.on('ready', async () => {
      const guild = client.guilds.resolve(GUILD_ID);
      if (guild === null) {
        console.log(`Could not connect to guild "${GUILD_ID}"`);
        return;
      }

      const simulatorChannel = guild.channels.cache.find(ch => ch.type === 'GUILD_TEXT' && ch.name === SIMULATOR_OUTPUT_CHANNEL) as Discord.TextChannel;
      if (simulatorChannel === undefined) {
        console.log(`Could not find ${SIMULATOR_OUTPUT_CHANNEL} channel`);
        return;
      }

      const metadataMap = loadMetadataMap();
      const simulator = new SIMULATOR_MAP[MODE]();

      do {
        await simulator.run(metadataMap, simulatorChannel);
      } while (SIMULATOR_INTERACTIVE)

      process.exit();
    });
    client.on('error', console.log)
  }
  catch (e) {
    console.log(e);
  }
})();
