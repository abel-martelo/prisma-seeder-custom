#!/usr/bin/env node

require('child_process');
const { generateSeed } = require('./generators/generate-seeds');
const { rollbackSeeds } = require('./rollbacks/down-seeds');
const { runSeeds } = require('./runner/run-seeds');

const [command, ...args] = process.argv.slice(2);

function showHelp() {
  console.log(`
Use:
  prisma-seeder-custom generate <seed_name>
  prisma-seeder-custom run
  prisma-seeder-custom rollback

Commands:
  generate   Creates a new seed file with the given name.
  run        Run all seed files in order.
  rollback   Reverts all executed seeds in reverse order, removing their data from the database.
  `);
}

(async () => {
  try {
    if (command === 'generate') {
      if (args.length === 0) {
        console.error("Error: You must provide a name for the seed.");
        showHelp();
        process.exit(1);
      }
      const seedName = args[0];
      await generateSeed(seedName);
    } else if (command === 'run') {
      if (args.length > 0) {
        console.error("Error: The 'run' command does not accept additional arguments.");
        showHelp();
        process.exit(1);
      }
      await runSeeds();
      console.log("All seed files have been executed successfully.");
    } else if (command === 'rollback') {
      if (args.length > 0) {
        console.error("Error: The 'rollback' command does not accept additional arguments.");
        showHelp();
        process.exit(1);
      }
        await rollbackSeeds();
    } else {
      console.error("Error: Unknown command.");
      showHelp();
      process.exit(1);
    }
  } catch (error) {
    console.error("Error executing:", error);
    process.exit(1);
  }
})();
