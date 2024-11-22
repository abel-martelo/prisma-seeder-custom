const path = require('path');
const fs = require('fs');
/**
 * Carga un módulo usando require si está disponible, de lo contrario, usa import().
 * @param {string} modulePath - La ruta del módulo a cargar.
 * @returns {Promise<any>} - El módulo cargado.
 */
async function loadModule(modulePath) {
  try {
    const fileUrl = pathToFileURL(modulePath);

    return await import(fileUrl);
  } catch (error) {
    if ( error.code === 'ERR_MODULE_NOT_FOUND' || error.code === 'ERR_UNSUPPORTED_ESM_URL_SCHEME') {
      return require(modulePath);
    }
    throw error;
  }
}

function pathToFileURL(modulePath) {
  const absolutePath = path.resolve(modulePath);
  return new URL(`file://${absolutePath}`);
}

function formatDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

function detectModuleSystem() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.type === 'module' ? 'esm' : 'commonjs';
  }
  return 'commonjs';
}

async function generateNumberedFileName(directory, baseName) {
  const files = fs.readdirSync(directory).filter((file) => /^\d+_/.test(file));
  const numbers = files.map((file) => parseInt(file.split('_')[0], 10));
  const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  const formattedNumber = String(nextNumber).padStart(2, '0');
  return `${formattedNumber}_${baseName}`;
}   

module.exports = { generateNumberedFileName, loadModule, formatDate, detectModuleSystem };
