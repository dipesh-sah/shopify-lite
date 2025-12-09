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

    // 1. Add 'tags' to 'products'
    const [prodColumns] = await connection.query(`SHOW COLUMNS FROM products LIKE 'tags'`);
    // @ts-ignore
    if (prodColumns.length === 0) {
      console.log('Adding tags column to products...');
      await connection.query(`ALTER TABLE products ADD COLUMN tags TEXT`);
    } else {
      console.log('tags column already exists in products.');
    }

    // 2. Ensure product_variants table exists (it might not if setup-db wasn't run recently or failed)
    // We'll just run the CREATE TABLE IF NOT EXISTS from the schema, ensuring 'options' is there.
    // Actually, simpler to just check table and alter.

    // Check if table exists
    const [tables] = await connection.query(`SHOW TABLES LIKE 'product_variants'`);
    // @ts-ignore
    if (tables.length === 0) {
      console.log('Creating product_variants table...');
      await connection.query(`
            CREATE TABLE product_variants (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                sku VARCHAR(100),
                price DECIMAL(10, 2) NOT NULL,
                inventory_quantity INT DEFAULT 0,
                options JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);
    } else {
      // Table exists, check for 'options' column
      const [varColumns] = await connection.query(`SHOW COLUMNS FROM product_variants LIKE 'options'`);
      // @ts-ignore
      if (varColumns.length === 0) {
        console.log('Adding options column to product_variants...');
        await connection.query(`ALTER TABLE product_variants ADD COLUMN options JSON`);
      } else {
        console.log('options column already exists in product_variants.');
      }
    }

    await connection.end();
  } catch (error) {
    console.error('Error fixing schema:', error);
    process.exit(1);
  }
}

fixSchema();
