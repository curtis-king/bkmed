require('dotenv').config({ path: __dirname + '/../.env' });
const sequelize = require('../src/config/database');

(async () => {
  try {
    await sequelize.query("ALTER TABLE identity_documents ADD COLUMN rejection_reason TEXT NULL AFTER status");
    console.log('✓ rejection_reason column added');
  } catch (e) {
    if (e.message?.includes('Duplicate column')) {
      console.log('✓ rejection_reason already exists');
    } else {
      console.error('Error:', e.message);
    }
  }
  process.exit(0);
})();
