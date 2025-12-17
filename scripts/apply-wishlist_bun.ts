
import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function migrate() {
  console.log('Starting Wishlist Migration (Bun)...');

  let connection;
  if (process.env.DATABASE_URL) {
    connection = await createConnection({ uri: process.env.DATABASE_URL });
  } else {
    connection = await createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "shopify_lite"
    });
  }

  try {
    await connection.query(`
        CREATE TABLE IF NOT EXISTS wishlists (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            product_id VARCHAR(36) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_wishlist (user_id, product_id)
        )
     `);
    console.log('Created wishlists table.');

    // Optional: Audit Logs table as mentioned in Phase 5
    await connection.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(36),
            action VARCHAR(255),
            details TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
     `);
    console.log('Created audit_logs table.');

  } catch (e) {
    console.error('Migration failed:', e);
  } finally {
    await connection.end();
  }
}

migrate();
