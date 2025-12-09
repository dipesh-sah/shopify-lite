
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixSchema() {
  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL is not defined in .env');
    process.exit(1);
  }

  console.log('Connecting to database...');
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('Connected.');

    // 1. Add 'parent_id' to 'categories'
    const [catColumns] = await connection.query(`SHOW COLUMNS FROM categories LIKE 'parent_id'`);
    // @ts-ignore
    if (catColumns.length === 0) {
      console.log('Adding parent_id column to categories...');
      await connection.query(`ALTER TABLE categories ADD COLUMN parent_id INT DEFAULT NULL`);
      await connection.query(`ALTER TABLE categories ADD CONSTRAINT fk_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL`);
    } else {
      console.log('parent_id column already exists in categories.');
    }

    // 2. Create 'attributes' table
    const [attrTables] = await connection.query(`SHOW TABLES LIKE 'attributes'`);
    // @ts-ignore
    if (attrTables.length === 0) {
      console.log('Creating attributes table...');
      await connection.query(`
            CREATE TABLE attributes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                options JSON,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
    } else {
      console.log('attributes table already exists.');
    }

    await connection.end();
  } catch (error) {
    console.error('Error fixing schema:', error);
    process.exit(1);
  }
}

fixSchema();
