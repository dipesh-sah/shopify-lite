
import { execute, pool } from '../src/lib/db';

async function checkProduct() {
  try {
    const rows = await execute('SELECT id, title FROM products WHERE id = 8');
    console.log('Product 8:', rows);
  } catch (error) {
    console.error('Failed to check product:', error);
  } finally {
    await pool.end();
  }
}

checkProduct();
