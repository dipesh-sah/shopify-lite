
import { createPool } from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

async function setupRulesDB() {
  const dbUrl = process.env.DATABASE_URL;
  console.log('Connecting to DB...', dbUrl ? 'Using DATABASE_URL' : 'Using individual vars');

  const config = dbUrl ? { uri: dbUrl } : {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };

  const pool = createPool({
    ...config,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    console.log('Creating Rules Table...');

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS rules (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        priority INT DEFAULT 0,
        payload JSON NOT NULL,
        module_type VARCHAR(50) DEFAULT 'general',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('Rules Table Created Successfully!');
  } catch (error) {
    console.error('Error creating rules table:', error);
  } finally {
    await pool.end();
  }
}

setupRulesDB();
