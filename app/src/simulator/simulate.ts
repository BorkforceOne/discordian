import * as Discord from 'discord.js';
import { DISCORD_API_KEY, GUILD_ID, Mode } from '../common';
import { loadMetadataMap } from './simulation_utils';
import { SimulatorConstructor } from './simulator';
import { NoopSimulator } from './simulators/noop_simulator';
import { ThreadSimulator } from './simulators/thread_simulator';

let MODE: Mode = Mode.THREADS;

const SIMULATOR_MAP: { [M in Mode]: SimulatorConstructor } = {
  [Mode.SINGLE_USER]: NoopSimulator,
  [Mode.THREADS]: ThreadSimulator,
};

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

      const simulatorChannel = guild.channels.cache.find(ch => ch.type === 'GUILD_TEXT' && ch.name === 'simulator') as Discord.TextChannel;
      if (simulatorChannel === undefined) {
        console.log("Could not find simulator channel");
        return;
      }

      const metadataMap = loadMetadataMap();
      const simulator = new SIMULATOR_MAP[MODE]();

      await simulator.run(metadataMap, simulatorChannel);

      process.exit();
    });
  }
  catch (e) {
    console.log(e);
  }
})();