
import 'dotenv/config';
import { query, execute, pool } from '../lib/db';

async function migrate() {
  const connection = await pool.getConnection();
  try {
    console.log('Starting migration: Adding variant_id to order_items...');

    // Check if column exists
    const [columns] = await connection.query<any[]>(
      "SHOW COLUMNS FROM order_items LIKE 'variant_id'"
    );

    if (columns.length === 0) {
      await connection.query(
        "ALTER TABLE order_items ADD COLUMN variant_id VARCHAR(36) NULL AFTER product_id"
      );
      console.log('Successfully added variant_id column to order_items table.');
    } else {
      console.log('Column variant_id already exists in order_items table.');
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    connection.release();
  }
}

migrate();
