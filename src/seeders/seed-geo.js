require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const geoData = require('../data/geoData');
const db = require('../models');

const seedGeo = async () => {
  const { Pays, Departement, Arrondissement } = db;
  const sequelize = db.sequelize;

  const [paysRows] = await sequelize.query(
    "SELECT id FROM pays WHERE code = 'CG' LIMIT 1"
  );
  let paysId;
  if (paysRows.length > 0) {
    paysId = paysRows[0].id;
  } else {
    const result = await sequelize.query(
      "INSERT INTO pays (name, code, nationality, created_at, updated_at) VALUES ('République du Congo', 'CG', 'Congolaise', NOW(), NOW())"
    );
    paysId = result[0];
  }

  for (const [depName, depData] of Object.entries(geoData)) {
    const [depRows] = await sequelize.query(
      `SELECT id FROM departements WHERE name = ${sequelize.escape(depName)} AND pays_id = ${paysId} LIMIT 1`
    );
    let depId;
    if (depRows.length > 0) {
      depId = depRows[0].id;
    } else {
      const result = await sequelize.query(
        `INSERT INTO departements (name, pays_id, created_at, updated_at) VALUES (${sequelize.escape(depName)}, ${paysId}, NOW(), NOW())`
      );
      depId = result[0];
    }

    for (const district of depData.districts) {
      const [arrRows] = await sequelize.query(
        `SELECT id FROM arrondissements WHERE name = ${sequelize.escape(district.name)} AND departement_id = ${depId} LIMIT 1`
      );
      if (arrRows.length === 0) {
        await sequelize.query(
          `INSERT INTO arrondissements (name, departement_id, created_at, updated_at) VALUES (${sequelize.escape(district.name)}, ${depId}, NOW(), NOW())`
        );
      }
    }
  }

  console.log('✓ Données géographiques du Congo initialisées');
};

module.exports = seedGeo;
