#!/usr/bin/env node

require('child_process');
const { generateSeed } = require('./generators/generateSeed');
const { runSeeds } = require('./runner/runSeeds');

const [command, ...args] = process.argv.slice(2);

function showHelp() {
  console.log(`
Uso:
  prisma-seeder-custom generate <nombre_de_la_semilla>
  prisma-seeder-custom run

Comandos:
  generate   Crea un nuevo archivo de semilla con el nombre proporcionado.
  run        Ejecuta todos los archivos de semillas en orden.
  `);
}

(async () => {
  try {
    if (command === 'generate') {
      if (args.length === 0) {
        console.error("Error: Debes proporcionar un nombre para la semilla.");
        showHelp();
        process.exit(1);
      }
      const seedName = args[0];
      await generateSeed(seedName);
    } else if (command === 'run') {
      if (args.length > 0) {
        console.error("Error: El comando 'run' no acepta argumentos adicionales.");
        showHelp();
        process.exit(1);
      }
      await runSeeds();
      console.log("Todos los archivos de semillas se han ejecutado con éxito.");
    } else {
      console.error("Error: Comando desconocido.");
      showHelp();
      process.exit(1);
    }
  } catch (error) {
    console.error("Error al ejecutar:", error);
    process.exit(1);
  }
})();
