require('dotenv').config({ path: __dirname + '/../.env' });
const sequelize = require('../src/config/database');

(async () => {
  try {
    const [result] = await sequelize.query("SHOW COLUMNS FROM identity_documents WHERE Field = 'rejection_reason'");
    if (result.length > 0) {
      console.log('✓ rejection_reason column EXISTS');
    } else {
      console.log('✗ rejection_reason column MISSING');
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
  process.exit(0);
})();
