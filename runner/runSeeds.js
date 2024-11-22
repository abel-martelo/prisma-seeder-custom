const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const inquirer = require('inquirer');
const { formatDate, loadModule } = require('../utils');
let prisma;

try {
  const { PrismaClient } = require(require.resolve('@prisma/client', { paths: [process.cwd()] }));
  prisma = new PrismaClient();
} catch (error) {
  console.error('❌ No se pudo encontrar @prisma/client en el proyecto del usuario:', error.message);
  process.exit(1);
}

const projectRoot = path.resolve(process.cwd());
const seedersDir = path.join(projectRoot, 'prisma', 'seeders');

async function ensureSeedExecutionTableExists() {
  try {
    await prisma.$queryRawUnsafe('SELECT 1 FROM "SeedExecution" LIMIT 1');
    console.log('✅ La tabla "SeedExecution" ya existe.');
    return true;
  } catch (error) {
    if (error.code === 'P2010') {
      console.log('ℹ️ La tabla "SeedExecution" no existe. Creándola...');
      try {
        await prisma.$queryRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "SeedExecution" (
            id SERIAL PRIMARY KEY,
            seedName VARCHAR(255) UNIQUE,
            executedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log('✅ Tabla "SeedExecution" creada correctamente.');
        return false;
      } catch (creationError) {
        console.error('❌ Error al crear la tabla "SeedExecution":', creationError.message);
        process.exit(1);
      }
    } else {
      console.error('❌ Error al verificar la tabla "SeedExecution":', error.message);
      await prisma.$disconnect();
      process.exit(1);
    }
  }
}

async function runMigrations() {
  try {
    const currentDate = formatDate();
    console.log('ℹ️ Ejecutando migraciones...');
    execSync(`npx prisma migrate dev --name=${currentDate}`, { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Error al ejecutar migración:', error.message);
    if (error.message.includes('environment is non-interactive')) {
      console.log('ℹ️ Aplicando migraciones existentes con `prisma migrate deploy`...');
      try {
        execSync('npx prisma migrate deploy', { stdio: 'inherit' });
      } catch (deployError) {
        console.error('❌ Error al aplicar migraciones existentes:', deployError.message);
        throw deployError;
      }
    } else {
      throw error;
    }
  }
}

async function runFileSeeds() {
  console.log('📁 Carpeta de semillas:', seedersDir);

  const seedFiles = fs.readdirSync(seedersDir).filter(file => file.endsWith('.js'));
  const sortedSeedFiles = seedFiles.sort();
  console.log('🗂️ Archivos de semillas ordenados:', sortedSeedFiles);

  for (const file of sortedSeedFiles) {
    const seedFunctionName = file.replace('.js', '');
    const existingSeed = await prisma.$queryRawUnsafe(`
      SELECT 1 
      FROM "SeedExecution" 
      WHERE seedName = $1
      LIMIT 1;
    `, seedFunctionName);

    if (existingSeed.length > 0) {
      console.log(`⚠️ La semilla '${seedFunctionName}' ya fue ejecutada, se omite.`);
      continue;
    }
    const modulePath = path.join(seedersDir, file);
    console.log(`⚙️ Cargando y ejecutando módulo desde: ${modulePath}`);
    try {
      loadModule(modulePath);
      console.log(`✅ Semilla "${file}" ejecutada correctamente.`);
      await prisma.$queryRawUnsafe(`
        INSERT INTO "SeedExecution" (seedName)
        VALUES ($1);
      `, seedFunctionName);
    } catch (error) {
      console.error(`❌ Error al ejecutar la semilla "${file}":`, error.message);
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
      message: '⚠️ La tabla "SeedExecution" no existe. ¿Deseas ejecutar migraciones antes de correr las semillas?',
      default: true,
    });
    if (shouldMigrate) {
      try {
        await runMigrations();
      } catch (error) {
        console.error('❌ Error al ejecutar las migraciones:', error.message);
        process.exit(1);
      }
    }
  }
  
  try {
    console.log('ℹ️ Ejecutando semillas...');
    await runFileSeeds();
    console.log('✅ Semillas ejecutadas correctamente.');
  } catch (error) {
    console.error('❌ Error al ejecutar las semillas:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { runSeeds };
