const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');

function addSeedConfigToPackageJson() {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = require(packageJsonPath);
    if (!packageJson.prisma) {
      packageJson.prisma = {};
    }
    if (!packageJson.prisma.seed) {
      packageJson.prisma.seed = 'node prisma/seed.js';
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('Se añadió la configuración de seed al package.json');
    } else {
      console.log('La configuración de seed ya existe en package.json');
    }
  } catch (error) {
    console.error('Error al modificar el package.json:', error.message);
  }
}

async function generateSeed(seedName) {
  try {
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
    const modelName = formattedSeedName.toLowerCase();
    const projectRoot = path.resolve(process.cwd());
    const seedersDir = path.join(projectRoot, 'prisma', 'seeders');

    if (!fs.existsSync(seedersDir)) {
      fs.mkdirSync(seedersDir, { recursive: true });
      console.log('Carpeta "prisma/seeders" creada.');
    }

  const seedTemplate = `
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function ${formattedSeedName}() {
  const existingCount = await prisma.${modelName}.count();
  if (existingCount === 0) {
    await prisma.${modelName}.createMany({
      data: [
        {
          name: 'Example Name',  // Ejemplo de campo personalizado
          email: 'example@example.com',  // Otro campo personalizado
          // Agregar otros campos según sea necesario
        },
        // Agregar más objetos si es necesario
      ],
    });
    console.log('Datos insertados correctamente en ${modelName}');
  } else {
    console.log('Los datos ya existen, no se insertan nuevamente');
  }
}
  `;

  const filePath = path.join(seedersDir, `${formattedSeedName}.js`);
    if (fs.existsSync(filePath)) {
      console.log(`La semilla ${formattedSeedName} ya existe en la carpeta seeders.`);
      return;
    }

    fs.writeFileSync(filePath, seedTemplate.trim());
    const relativePath = path.relative(projectRoot, filePath);
    console.log(`Semilla '${formattedSeedName}' creada en ${relativePath}`);
    addSeedConfigToPackageJson();
  } catch (error) {
    console.error('Error al generar la semilla:', error.message);
  }
}

module.exports = { generateSeed };
