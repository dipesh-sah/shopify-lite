
import { query } from '../src/lib/db';

async function main() {
  const sql = `
    SELECT 
      o.id, o.created_at, o.status, o.total, o.shipping_cost,
      o.currency,
      CONCAT(COALESCE(o.first_name, ''), ' ', COALESCE(o.last_name, '')) as customer_name,
      o.customer_email,
      (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
    FROM orders o
    ORDER BY o.created_at DESC
  `;

  try {
    console.log('Running Export SQL Query...');
    const rows = await query(sql);
    console.log(`Success! Retrieved ${rows.length} rows.`);
    if (rows.length > 0) {
      console.log('Sample row:', rows[0]);
    }
  } catch (error) {
    console.error('SQL Query Failed:', error);
  }
}

main();
