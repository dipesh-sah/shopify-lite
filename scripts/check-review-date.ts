
import { execute, pool } from '../src/lib/db';

async function checkDate() {
  try {
    const rows = await execute('SELECT id, created_at FROM reviews LIMIT 5');
    console.log('Reviews:', rows);
  } catch (error) {
    console.error('Failed to check date:', error);
  } finally {
    await pool.end();
  }
}

checkDate();
