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

    // Check if category_id column exists
    const [columns] = await connection.query(`SHOW COLUMNS FROM products LIKE 'category_id'`);

    // @ts-ignore
    if (columns.length === 0) {
      console.log('Column category_id not found in products table. Adding it...');
      await connection.query(`ALTER TABLE products ADD COLUMN category_id INT`);
      console.log('Column added successfully.');
    } else {
      console.log('Column category_id already exists.');
    }

    await connection.end();
  } catch (error) {
    console.error('Error fixing schema:', error);
    process.exit(1);
  }
}

fixSchema();
