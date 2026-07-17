const db = require('../src/models');

(async () => {
  try {
    const [results] = await db.sequelize.query("SHOW COLUMNS FROM users LIKE 'availability'");
    if (results.length === 0) {
      await db.sequelize.query("ALTER TABLE users ADD COLUMN availability ENUM('AVAILABLE','BUSY','UNAVAILABLE') DEFAULT 'AVAILABLE'");
      console.log('✓ availability column added');
    } else {
      console.log('✓ availability column already exists');
    }
  } catch (e) {
    console.log('Note:', e.message.substring(0, 80));
  }

  try {
    const [results] = await db.sequelize.query("SHOW TABLES LIKE 'notifications'");
    if (results.length === 0) {
      await db.sequelize.query(`
        CREATE TABLE notifications (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          user_id BIGINT NOT NULL,
          type VARCHAR(100) NOT NULL,
          resource_type VARCHAR(50),
          resource_id BIGINT,
          message TEXT NOT NULL,
          is_read BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_notif_user (user_id),
          INDEX idx_notif_user_read (user_id, is_read),
          INDEX idx_notif_resource (resource_type, resource_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log('✓ notifications table created');
    } else {
      console.log('✓ notifications table already exists');
    }
  } catch (e) {
    console.error('DB error:', e.message);
    process.exit(1);
  }

  console.log('✓ Sync complete');
  process.exit(0);
})();
