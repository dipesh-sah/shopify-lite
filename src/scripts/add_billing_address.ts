
import dotenv from 'dotenv';

// Load env from current directory
dotenv.config();

async function updateOrdersTable() {
  try {
    const { execute, query } = await import('../lib/db');

    console.log('Checking orders table schema for billing columns...');

    // Check if columns exist
    const columns = await query("SHOW COLUMNS FROM orders LIKE 'billing_first_name'");
    if (columns.length > 0) {
      console.log('Billing address columns already exist.');
      process.exit(0);
    }

    console.log('Adding billing address columns to orders table...');

    const alterSql = `
      ALTER TABLE orders
      ADD COLUMN billing_first_name VARCHAR(255),
      ADD COLUMN billing_last_name VARCHAR(255),
      ADD COLUMN billing_company VARCHAR(255),
      ADD COLUMN billing_address1 VARCHAR(255),
      ADD COLUMN billing_address2 VARCHAR(255),
      ADD COLUMN billing_city VARCHAR(255),
      ADD COLUMN billing_province VARCHAR(255),
      ADD COLUMN billing_zip VARCHAR(20),
      ADD COLUMN billing_country VARCHAR(255),
      ADD COLUMN billing_phone VARCHAR(50)
    `;

    await execute(alterSql);
    console.log('Orders table updated successfully with billing columns.');

    process.exit(0);
  } catch (error) {
    console.error('Error updating orders table:', error);
    process.exit(1);
  }
}

updateOrdersTable();
