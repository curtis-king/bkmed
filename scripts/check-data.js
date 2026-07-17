require('dotenv').config({ path: __dirname + '/../.env' });
const sequelize = require('../src/config/database');

(async () => {
  try {
    const [doc1] = await sequelize.query("SELECT COUNT(*) as cnt FROM identity_documents");
    console.log('identity_documents count:', doc1[0].cnt);
    const [doc2] = await sequelize.query("SELECT COUNT(*) as cnt FROM identitydocuments");
    console.log('identitydocuments count:', doc2[0].cnt);

    if (doc1[0].cnt > 0) {
      const [rows] = await sequelize.query("SELECT * FROM identity_documents LIMIT 2");
      console.log('Sample from identity_documents:', JSON.stringify(rows, null, 2));
    }
    if (doc2[0].cnt > 0) {
      const [rows] = await sequelize.query("SELECT * FROM identitydocuments LIMIT 2");
      console.log('Sample from identitydocuments:', JSON.stringify(rows, null, 2));
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
  process.exit(0);
})();
