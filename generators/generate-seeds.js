const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const { formatDate, detectModuleSystem } = require('../utils');

async function generateSeed(seedName) {
  try {
    const projectRoot = path.resolve(process.cwd());
    const seedersDir = path.join(projectRoot, 'prisma', 'seeders');
    if (!fs.existsSync(seedersDir)) {
      fs.mkdirSync(seedersDir, { recursive: true });
      console.log('📂 "prisma/seeders" folder created.');
    }
    if (!seedName) {
      const answer = await inquirer.prompt({
        type: 'input',
        name: 'seedName',
        message: 'Seed name:',
        validate: (input) => (input.trim() ? true : 'The name cannot be empty.'),
      });
      seedName = answer.seedName;
    }
    const formattedSeedName = seedName.charAt(0).toUpperCase() + seedName.slice(1);
    const currentDate = formatDate();
    const fileName = `${currentDate}_${formattedSeedName + '.js'}`;

    const filePath = path.join(seedersDir, fileName);
    if (fs.existsSync(filePath)) {
      console.log(`⚠️ The seed "${fileName}" already exists.`);
      return;
    }
    const seedTemplateESM = `
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function main() {
  const ${seedName.toLowerCase()} = await prisma.${seedName.toLowerCase()}.upsert({
    where: { id: 1 }, // Change depending on the model
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
  console.log('✅ Data successfully inserted into ${seedName.toLowerCase()}');
}

export async function down() {
  try {
    const deleted = await prisma.${seedName.toLowerCase()}.deleteMany({
      where: {
        email: 'example@example.com', // Condition that identifies the data created by the seed
      },
    });
    console.log(\`↩️ Rollback completed: \${deleted.count} records deleted.\`);
  } catch (e) {
    console.error('❌ Error while performing rollback:', e.message);
    throw e;
  }
}
;`
.trim();

const seedTemplateCommonJS = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ${seedName.toLowerCase()} = await prisma.${seedName.toLowerCase()}.upsert({
    where: { id: 1 }, // Change depending on the model
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
  console.log('✅ Data successfully inserted into ${seedName.toLowerCase()}');
}

async function down() {
  try {
    const deleted = await prisma.${seedName.toLowerCase()}.deleteMany({
      where: {
        email: 'example@example.com', // Condition that identifies the data created by the seed
      },
    });
    console.log(\`↩️ Rollback completed: \${deleted.count} records deleted.\`);
  } catch (e) {
    console.error('❌ Error while performing rollback:', e.message);
    throw e;
  }
}  
module.exports = { main, down };

`.trim();

    const moduleSystem = detectModuleSystem();
    const seedTemplate = moduleSystem === 'esm' ? seedTemplateESM : seedTemplateCommonJS;
    fs.writeFileSync(filePath, seedTemplate);
    console.log(`✅ Seed "${fileName}" created in "prisma/seeders".`);
  } catch (error) {
    console.error('❌ Error generating seed:', error);
  }
}

module.exports = { generateSeed };
