const mysql = require('mysql2/promise');

(async () => {
  const c = await mysql.createConnection({
    host: 'localhost', user: 'root', password: '', database: 'medconnect-f',
    connectTimeout: 5000,
  });

  let [r] = await c.execute("SHOW TABLES LIKE 'notifications'");
  console.log('notifications table:', r.length ? 'EXISTS' : 'MISSING');
  if (!r.length) {
    await c.execute(
      'CREATE TABLE notifications (id BIGINT AUTO_INCREMENT PRIMARY KEY,user_id BIGINT NOT NULL,type VARCHAR(100) NOT NULL,resource_type VARCHAR(50),resource_id BIGINT,message TEXT NOT NULL,is_read BOOLEAN DEFAULT FALSE,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,INDEX idx_notif_user(user_id),INDEX idx_notif_user_read(user_id,is_read),INDEX idx_notif_resource(resource_type,resource_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'
    );
    console.log('-> created notifications table');
  }

  [r] = await c.execute("SHOW COLUMNS FROM users LIKE 'availability'");
  console.log('availability column:', r.length ? 'EXISTS' : 'MISSING');
  if (!r.length) {
    await c.execute("ALTER TABLE users ADD COLUMN availability ENUM('AVAILABLE','BUSY','UNAVAILABLE') DEFAULT 'AVAILABLE'");
    console.log('-> added availability column');
  }

  await c.end();
  console.log('Done');
  process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
