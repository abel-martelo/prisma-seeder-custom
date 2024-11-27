const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(process.cwd());
const seedersDir = path.join(projectRoot, 'prisma', 'seeders');

/**
 * Load a module using require if available, otherwise use import().
 * @param {string} modulePath - The path of the module to load.
 * @returns {Promise<any>} - The module loaded.
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

function getPrismaClient() {
  try {
    const { PrismaClient } = require(require.resolve('@prisma/client', { paths: [process.cwd()] }));
    return new PrismaClient();
  } catch (error) {
    console.error('❌ Could not find @prisma/client in the user project:', error.message);
    process.exit(1);
  }
}

module.exports = { projectRoot, seedersDir, getPrismaClient, loadModule, formatDate, detectModuleSystem };
