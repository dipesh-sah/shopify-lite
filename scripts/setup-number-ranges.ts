
import { pool } from '../src/lib/db';

async function setupNumberRanges() {
  console.log('Setting up Number Ranges...');
  const connection = await pool.getConnection();

  try {
    // 1. Create number_ranges table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS number_ranges (
        id VARCHAR(36) PRIMARY KEY,
        type VARCHAR(50) NOT NULL UNIQUE,
        prefix VARCHAR(20) DEFAULT '',
        suffix VARCHAR(20) DEFAULT '',
        start_value INT DEFAULT 1000,
        current_value INT DEFAULT 1000,
        description VARCHAR(255),
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Created number_ranges table.');

    // 2. Insert default ranges if they don't exist
    const [existing] = await connection.query('SELECT type FROM number_ranges');
    const existingTypes = (existing as any[]).map(r => r.type);

    if (!existingTypes.includes('order')) {
      await connection.query(`
        INSERT INTO number_ranges (id, type, prefix, suffix, start_value, current_value, description)
        VALUES (UUID(), 'order', 'ORD-', '', 10000, 10000, 'Order Numbers')
      `);
      console.log('Inserted default order number range.');
    }

    if (!existingTypes.includes('product')) {
      await connection.query(`
        INSERT INTO number_ranges (id, type, prefix, suffix, start_value, current_value, description)
        VALUES (UUID(), 'product', 'PRD-', '', 1000, 1000, 'Product Numbers')
      `);
      console.log('Inserted default product number range.');
    }

    // 3. Add order_number to orders table
    try {
      await connection.query(`
        ALTER TABLE orders ADD COLUMN order_number VARCHAR(50) UNIQUE AFTER id
      `);
      console.log('Added order_number to orders table.');
    } catch (err: any) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('order_number column already exists.');
      } else {
        throw err;
      }
    }

    // 4. Add product_number to products table
    try {
      await connection.query(`
        ALTER TABLE products ADD COLUMN product_number VARCHAR(50) UNIQUE AFTER id
      `);
      console.log('Added product_number to products table.');
    } catch (err: any) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('product_number column already exists.');
      } else {
        throw err;
      }
    }

    console.log('Setup complete.');

  } catch (error) {
    console.error('Setup failed:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

setupNumberRanges();
