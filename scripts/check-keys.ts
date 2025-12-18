
import { query } from '../src/lib/db';

async function main() {
  try {
    const rows = await query('SELECT * FROM orders LIMIT 1');
    if (rows.length > 0) {
      console.log('Order Keys:', Object.keys(rows[0]).join(', '));
    } else {
      console.log('No orders found to check columns.');
    }
  } catch (error) {
    console.error('Failed to get order:', error);
  }
}

main();
