const db = require('../models');

const seedAdmin = async () => {
  try {
    const [admin] = await db.User.findOrCreate({
      where: { email: 'admin@gmail.com' },
      defaults: {
        first_name: 'Admin',
        last_name: 'MedConnect',
        email: 'admin@gmail.com',
        phone: '+242000000000',
        password: '123456789',
        gender: 'homme',
        dossier_number: 'DOS-ADMIN-000001',
        verification_level: 'IDENTITY_VERIFIED',
      },
    });

    const roleAdmin = await db.Role.findOne({ where: { name: 'ADMIN' } });
    if (roleAdmin) {
      await admin.addRole(roleAdmin);
    }

    console.log('✓ Admin créé: admin@gmail.com / 123456789');
  } catch (err) {
    console.error('Erreur seed admin:', err.message);
  }
};

module.exports = seedAdmin;
