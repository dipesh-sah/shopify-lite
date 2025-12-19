
import { execute, pool } from '../src/lib/db';

async function listReviews() {
  try {
    const rows = await execute('SELECT id, title, product_id FROM reviews LIMIT 10');
    console.log('Reviews:', rows);
  } catch (error) {
    console.error('Failed to list reviews:', error);
  } finally {
    await pool.end();
  }
}

listReviews();
