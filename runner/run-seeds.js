const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const inquirer = require('inquirer');
const { formatDate, loadModule, getPrismaClient, seedersDir } = require('../utils');
const prisma = getPrismaClient();

async function ensureSeedExecutionTableExists() {
  try {
    await prisma.$queryRawUnsafe('SELECT 1 FROM "SeedExecution" LIMIT 1');
    console.log('✅ The "SeedExecution" table already exists.');
    return true;
  } catch (error) {
    if (error.code === 'P2010') {
      console.log('⚠️ The "SeedExecution" table does not exist. Creating it...');
      try {
        await prisma.$queryRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "SeedExecution" (
            id SERIAL PRIMARY KEY,
            seedName VARCHAR(255) UNIQUE,
            executedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log('✅ "SeedExecution" table created successfully.');
        return false;
      } catch (creationError) {
        console.error('❌ Error creating table "SeedExecution":', creationError.message);
        process.exit(1);
      }
    } else {
      console.error('❌ Error checking table "SeedExecution":', error.message);
      await prisma.$disconnect();
      process.exit(1);
    }
  }
}

async function runMigrations() {
  try {
    const currentDate = formatDate();
    console.log('ℹ️ Running migrations...');
    execSync(`npx prisma migrate dev --name=${currentDate}`, { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Error when running migration:', error.message);
    if (error.message.includes('environment is non-interactive')) {
      console.log('ℹ️ Applying existing migrations with `prisma migrate deploy`...');
      try {
        execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      } catch (deployError) {
        console.error('❌ Error applying existing migrations:', deployError.message);
        throw deployError;
      }
    } else {
      throw error;
    }
  }
}

async function runFileSeeds() {
  console.log('📁 Seed folder:', seedersDir);

  const seedFiles = fs.readdirSync(seedersDir).filter(file => file.endsWith('.js')).sort();
  console.log('🗂️ Sorted seed files:', seedFiles);

  for (const file of seedFiles) {
    const seedFunctionName = file.replace('.js', '');
    const existingSeed = await prisma.$queryRawUnsafe(`
      SELECT 1 
      FROM "SeedExecution" 
      WHERE seedName = $1
      LIMIT 1;
    `, seedFunctionName);

    if (existingSeed.length > 0) {
      console.log(`⚠️ Seed '${seedFunctionName}' has already been executed, it is ignored.`);
      continue;
    }
    const modulePath = path.join(seedersDir, file);
    console.log(`⚙️ Loading and running module from: ${modulePath}`);
    try {
      const seedModule = await loadModule(modulePath);
      if (typeof seedModule.main !== 'function') {
        console.warn(`⚠️ The seed ${file} does not have a "main" function, it is ignored.`);
        continue;
      }
      await seedModule.main();
      await prisma.$queryRawUnsafe(`
        INSERT INTO "SeedExecution" (seedName)
        VALUES ($1);
      `, seedFunctionName);
      console.log(`✅ Seed "${file}" executed successfully.`);
    } catch (error) {
      console.error(`❌ Error executing seed "${file}":`, error.message);
      throw error;
    }
  }
}

async function runSeeds() {
  const seedTableExists = await ensureSeedExecutionTableExists();
  if (!seedTableExists) {
    const { shouldMigrate } = await inquirer.prompt({
      type: 'confirm',
      name: 'shouldMigrate',
      message: '⚠️ The table "SeedExecution" does not exist. Do you want to run migrations before running seeds?',
      default: true,
    });
    if (shouldMigrate) {
      try {
        await runMigrations();
      } catch (error) {
        console.error('❌ Error when running migrations:', error.message);
        process.exit(1);
      }
    }
  }
  
  try {
    console.log('ℹ️ Running seeds...');
    await runFileSeeds();
    console.log('✅ Seeds executed correctly.');
  } catch (error) {
    console.error('❌ Error when running seeds:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { runSeeds };
