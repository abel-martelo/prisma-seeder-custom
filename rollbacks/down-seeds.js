const path = require('path');
const fs = require('fs');
const { loadModule, getPrismaClient, seedersDir } = require('../utils');
const prisma = getPrismaClient();

async function rollbackSeeds() {
    console.log('↩️ Starting seed rollback...');
    const executedSeeds = await prisma.$queryRawUnsafe(`
      SELECT "seedName" 
      FROM "SeedExecution" 
      ORDER BY "executedAt" DESC;
    `);
    if (executedSeeds.length === 0) {
      console.log('ℹ️ There are no seeds to reverse.');
      return;
    }
    for (const seed of executedSeeds) {
      const seedFile = `${seed.seedName}.js`;
      const modulePath = path.join(seedersDir, seedFile);
      if (!fs.existsSync(modulePath)) {
        console.warn(`⚠️ Seed file not found: ${seedFile}, ignored.`);
        continue;
      }
      try {
        console.log(`⚙️ Reverting seed: ${seedFile}`);
        const seedModule = await loadModule(modulePath); 
        if (typeof seedModule.down !== 'function') {
          console.warn(`⚠️ The seed ${seedFile} has no "down" function, it is ignored.`);
          continue;
        }
        await seedModule.down();
        await prisma.$queryRawUnsafe(`
          DELETE FROM "SeedExecution"
          WHERE "seedName" = $1;
        `, seed.seedName);
  
        console.log(`✅ Seed "${seedFile}" successfully reverted.`);
      } catch (error) {
        console.error(`❌ Error reverting seed "${seedFile}":`, error.message);
        throw error;
      }
    }
  }

  module.exports = { rollbackSeeds };
