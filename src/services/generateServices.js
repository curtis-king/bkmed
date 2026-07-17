/**
 * Script de génération automatique des services
 * 
 * Utilisation: node src/services/generateServices.js
 * 
 * Ce script lit les modèles Sequelize dans src/models/ et génère
 * automatiquement les services correspondants dans src/services/.
 * Les services déjà existants avec de la logique personnalisée
 * ne sont pas écrasés.
 */

const fs = require('fs');
const path = require('path');

const MODELS_DIR = path.join(__dirname, '..', 'models');
const SERVICES_DIR = path.join(__dirname);
const EXISTING_SERVICES = new Set(fs.readdirSync(SERVICES_DIR)
  .filter(f => f.endsWith('.js') && f !== 'generateServices.js' && f !== 'baseService.js')
  .map(f => f.replace('Service.js', '').toLowerCase()));

const MODEL_FILES = fs.readdirSync(MODELS_DIR)
  .filter(f => f.endsWith('.js') && f !== 'index.js');

// Modèles à ignorer (pas de service nécessaire)
const IGNORE = ['index', 'userrole', 'prescriptionitem'];

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function camelCase(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function getModelName(filename) {
  return path.basename(filename, '.js');
}

function getTableName(modelName) {
  return modelName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
}

function generateServiceContent(modelName) {
  const varName = camelCase(modelName);
  const modelPath = `../models/${modelName}`;

  return `const BaseService = require('./baseService');
const ${modelName} = require('${modelPath}');

class ${modelName}Service extends BaseService {
  constructor() {
    super(${modelName});
  }
}

module.exports = new ${modelName}Service();
`;
}

function needsGeneration(modelName) {
  const key = modelName.toLowerCase();
  return !EXISTING_SERVICES.has(key) && !IGNORE.includes(key);
}

async function generate() {
  console.log('=== Générateur de services ===\n');

  let generated = 0;
  let skipped = 0;

  for (const file of MODEL_FILES) {
    const modelName = getModelName(file);

    if (!needsGeneration(modelName)) {
      if (IGNORE.includes(modelName.toLowerCase())) {
        console.log(`  [IGNORÉ] ${modelName} (modèle ignoré)`);
      } else {
        console.log(`  [EXISTANT] ${modelName}Service.js (déjà présent avec logique personnalisée)`);
      }
      skipped++;
      continue;
    }

    const content = generateServiceContent(modelName);
    const outputPath = path.join(SERVICES_DIR, `${camelCase(modelName)}Service.js`);

    fs.writeFileSync(outputPath, content, 'utf-8');
    console.log(`  [GÉNÉRÉ] ${camelCase(modelName)}Service.js`);
    generated++;
  }

  console.log(`\n=== Résumé: ${generated} généré(s), ${skipped} ignoré(s) ===`);
}

generate().catch(console.error);
