const path = require('path');

/**
 * Carga un módulo usando require si está disponible, de lo contrario, usa import().
 * @param {string} modulePath - La ruta del módulo a cargar.
 * @returns {Promise<any>} - El módulo cargado.
 */
async function loadModule(modulePath) {
  try {
    return require(modulePath);
  } catch (error) {
    if (error.code === 'ERR_REQUIRE_ESM') {
      const moduleUrl = pathToFileURL(modulePath).href;
      return import(moduleUrl);
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

module.exports = { loadModule, formatDate };
