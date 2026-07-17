require('dotenv').config({ path: __dirname + '/../.env' });
const sequelize = require('../src/config/database');

(async () => {
  try {
    const [result] = await sequelize.query("SHOW CREATE TABLE identity_documents");
    console.log(result[0]['Create Table']);
  } catch (e) {
    console.error('Error:', e.message);
  }
  process.exit(0);
})();
