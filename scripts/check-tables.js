require('dotenv').config({ path: __dirname + '/../.env' });
const sequelize = require('../src/config/database');

(async () => {
  try {
    const [tables] = await sequelize.query("SHOW TABLES");
    console.log('Tables in database:');
    tables.forEach(t => {
      const values = Object.values(t);
      console.log(' -', values[0]);
    });

    const [result] = await sequelize.query("SHOW COLUMNS FROM identity_documents");
    console.log('\nColumns in identity_documents:');
    result.forEach(c => console.log(' -', c.Field));
  } catch (e) {
    console.error('Error:', e.message);
  }
  process.exit(0);
})();
