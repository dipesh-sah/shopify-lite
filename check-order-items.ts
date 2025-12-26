import { query } from './src/lib/db';

async function checkOrderItems() {
  console.log('Checking order_items table structure...\n');

  // Check table structure
  const columns = await query(`DESCRIBE order_items`);
  console.log('Table columns:');
  console.table(columns);

  // Check recent order items
  const items = await query(`
    SELECT id, order_id, product_id, product_name, image_url, created_at
    FROM order_items
    ORDER BY created_at DESC
    LIMIT 5
  `);

  console.log('\nRecent order items:');
  console.table(items);

  process.exit(0);
}

checkOrderItems().catch(console.error);
