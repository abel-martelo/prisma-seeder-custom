const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { loadModule, formatDate } = require('../utils');

let prisma;
try {
  const { PrismaClient } = require(require.resolve('@prisma/client', { paths: [process.cwd()] }));
  prisma = new PrismaClient();
} catch (error) {
  console.error('No se pudo encontrar @prisma/client en el proyecto del usuario.', error);
  process.exit(1);
}

const projectRoot = path.resolve(process.cwd());
const seedFilePath = path.join(projectRoot, 'prisma', 'seed.js');
const seedersDir = path.join(projectRoot, 'prisma', 'seeders');

async function ensureSeedExecutionTableExists() {
  try {
    await prisma.$queryRawUnsafe('SELECT 1 FROM "SeedExecution" LIMIT 1');
  } catch (error) {
    if (error.code === 'P2010') {
      console.log('Creando la tabla SeedExecution...');
      await prisma.$queryRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "SeedExecution" (
          id SERIAL PRIMARY KEY,
          seedName VARCHAR(255) UNIQUE,
          executedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Tabla "SeedExecution" creada correctamente.');
    } else {
      console.error('Error al crear la tabla SeedExecution:', error);
      await prisma.$disconnect();
      process.exit(1);
    }
  }
}

async function runMigrations() {
  try {
    const currentDate = formatDate();
    console.log(`Ejecutando migraciones...`);
    execSync(`npx prisma migrate dev --name=${currentDate}`, { stdio: 'inherit' });
  } catch (error) {
    console.error('Error al ejecutar migración:', error.message);

    if (error.message.includes('environment is non-interactive')) {
      console.log('Aplicando migraciones existentes con `prisma migrate deploy`...');
      try {
        execSync('npx prisma migrate deploy --preview-feature', { stdio: 'inherit' });
      } catch (deployError) {
        console.error('Error al aplicar migraciones existentes:', deployError.message);
        throw deployError;
      }
    } else {
      throw error;
    }
  }
}


function createSeedFileIfNotExists() {
  if (!fs.existsSync(seedersDir)) {
    fs.mkdirSync(seedersDir, { recursive: true });
  }
  if (!fs.existsSync(seedFilePath)) {
    const seedJsTemplate = `
    import fs from 'fs';
    import path from 'path';
    async function runSeeds() {
      const seedersDir = path.join(process.cwd(), 'prisma', 'seeders');
      const seedFiles = fs.readdirSync(seedersDir);
      const jsFiles = seedFiles.filter(file => file.endsWith('.js'));
      for (const file of jsFiles) {
        const seedFunctionName = file.replace('.js', '');
        const modulePath = path.join(seedersDir, file);
        const module = await import(modulePath);
        if (typeof module[seedFunctionName] !== 'function') {
          console.error(\`El archivo "\${file}" no exporta una función válida.\`);
          continue;
        }
        console.log(\`Ejecutando semilla: \${file}\`);
        await module[seedFunctionName]();
      }
    }
    runSeeds().catch((error) => {
      console.error("Error al ejecutar las semillas:", error);
      process.exit(1);
    });
    `;
fs.writeFileSync(seedFilePath, seedJsTemplate.trim());
console.log('Archivo "prisma/seed.js" creado correctamente con la configuración para ejecutar las semillas.');  
} else {
  console.log('El archivo "prisma/seed.js" ya existe.');
}
};


async function runSeeds() {

  await ensureSeedExecutionTableExists();
  await runMigrations();
  createSeedFileIfNotExists();
  const seedFiles = fs.readdirSync(seedersDir);

  for (const file of seedFiles) {
    const seedFunctionName = file.replace('.js', '');
    const existingSeed = await prisma.$queryRawUnsafe(`
      SELECT 1 
      FROM "SeedExecution" 
      WHERE seedName = $1
      LIMIT 1;
    `, seedFunctionName);
    if (existingSeed) {
      console.log(`La semilla '${seedFunctionName}' ya fue ejecutada, se omite.`);
      continue; 
    }
    try {
    const modulePath = path.join(seedersDir, file);
    const module = await loadModule(modulePath); 
    if (typeof module[seedFunctionName] !== 'function') {
      console.error(`El archivo "${file}" no exporta una función válida.`);
      continue;
    }

    console.log(`Ejecutando semilla: ${file}`);
    await module[seedFunctionName]();
    await prisma.$queryRawUnsafe(`
      INSERT INTO "SeedExecution" (seedName) 
      VALUES ($1);
    `, seedFunctionName);
    console.log(`Semilla '${seedFunctionName}' registrada como ejecutada.`);
  } catch(error) {
    console.error(`Error al ejecutar la semilla '${seedFunctionName}':`, error);
   } finally {
    await prisma.$disconnect();
   }
 }
}

module.exports = { runSeeds };
