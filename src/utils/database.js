const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

(async () => {
  const connection = await pool.getConnection();
  await connection.query(`
    CREATE TABLE IF NOT EXISTS countries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      capital VARCHAR(255),
      region VARCHAR(255),
      population BIGINT NOT NULL,
      currency_code VARCHAR(10),
      exchange_rate DECIMAL(10, 4),
      estimated_gdp DECIMAL(20, 2),
      flag_url VARCHAR(500),
      last_refreshed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_region (region),
      INDEX idx_currency_code (currency_code),
      INDEX idx_name (name)
    );
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS system_status (
      id INT PRIMARY KEY DEFAULT 1,
      total_countries INT DEFAULT 0,
      last_refreshed_at TIMESTAMP NULL,
      CONSTRAINT single_status CHECK (id = 1)
    );
  `);

  await connection.query(`
    INSERT IGNORE INTO system_status (id, total_countries, last_refreshed_at)
    VALUES (1, 0, NULL);
  `);
})();

// Test the connection
pool.getConnection()
  .then(connection => {
    console.log('Database connected successfully');
    connection.release();
  })
  .catch(error => {
    console.error('Database connection failed:', error.message);
  });

module.exports = pool;