import { pool } from './src/lib/db';

async function verifySchema() {
  try {
    console.log('📊 Checking database schema...\n');

    // Check what columns exist in customers table
    const [customerColumns]: any = await pool.query(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = 'shopify_lite' AND TABLE_NAME = 'customers'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('✅ Customers table columns:');
    console.table(customerColumns.map((c: any) => ({
      name: c.COLUMN_NAME,
      type: c.COLUMN_TYPE
    })));

    // Check what columns exist in orders table
    const [orderColumns]: any = await pool.query(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = 'shopify_lite' AND TABLE_NAME = 'orders'
      ORDER BY ORDINAL_POSITION
    `);

    console.log('\n✅ Orders table columns:');
    console.table(orderColumns.map((c: any) => ({
      name: c.COLUMN_NAME,
      type: c.COLUMN_TYPE
    })));

    // Check new B2B tables
    const [tables]: any = await pool.query(`
      SELECT TABLE_NAME, TABLE_ROWS
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = 'shopify_lite'
        AND TABLE_NAME LIKE '%b2b%'
      ORDER BY TABLE_NAME
    `);

    console.log('\n✅ B2B-related tables:');
    console.table(tables);

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

verifySchema();
