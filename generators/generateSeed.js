const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const { generateNumberedFileName, detectModuleSystem } = require('../utils');

async function generateSeed(seedName) {
  try {
    const projectRoot = path.resolve(process.cwd());
    const seedersDir = path.join(projectRoot, 'prisma', 'seeders');
    if (!fs.existsSync(seedersDir)) {
      fs.mkdirSync(seedersDir, { recursive: true });
      console.log('📂 Carpeta "prisma/seeders" creada.');
    }
    if (!seedName) {
      const answer = await inquirer.prompt({
        type: 'input',
        name: 'seedName',
        message: 'Nombre de la semilla:',
        validate: (input) => (input.trim() ? true : 'El nombre no puede estar vacío.'),
      });
      seedName = answer.seedName;
    }
    const formattedSeedName = seedName.charAt(0).toUpperCase() + seedName.slice(1);
    const fileName = await generateNumberedFileName(seedersDir, formattedSeedName + '.js');

    const filePath = path.join(seedersDir, fileName);
    if (fs.existsSync(filePath)) {
      console.log(`⚠️ La semilla "${fileName}" ya existe.`);
      return;
    }
    const seedTemplateESM = `
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const ${seedName.toLowerCase()} = await prisma.${seedName.toLowerCase()}.upsert({
    where: { id: 1 }, // Cambiar según el modelo
    update: {},
    create: {
      name: 'Example Name',
      email: 'example@example.com',
      posts: {
        create: [
          {
            title: 'First Post',
            content: 'Content of the first post',
            published: true,
          },
        ],
      },
    },
  });
  console.log('${seedName.toLowerCase()}: ',${seedName.toLowerCase()})
  console.log('✅ Datos insertados correctamente en ${seedName.toLowerCase()}');
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
    `.trim();

const seedTemplateCommonJS = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ${seedName.toLowerCase()} = await prisma.${seedName.toLowerCase()}.upsert({
    where: { id: 1 }, // Cambiar según el modelo
    update: {},
    create: {
      name: 'Example Name',
      email: 'example@example.com',
      posts: {
        create: [
          {
            title: 'First Post',
            content: 'Content of the first post',
            published: true,
          },
        ],
      },
    },
  });

  console.log('${seedName.toLowerCase()}: ',${seedName.toLowerCase()})
  console.log('✅ Datos insertados correctamente en ${seedName.toLowerCase()}');
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
        `.trim();
    const moduleSystem = detectModuleSystem();
    const seedTemplate = moduleSystem === 'esm' ? seedTemplateESM : seedTemplateCommonJS;
    fs.writeFileSync(filePath, seedTemplate);
    console.log(`✅ Semilla "${fileName}" creada en "prisma/seeders".`);
  } catch (error) {
    console.error('❌ Error al generar la semilla:', error);
  }
}

module.exports = { generateSeed };
