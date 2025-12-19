
import { execute, pool } from '../src/lib/db';

async function checkSchema() {
  try {
    const rows = await execute('DESCRIBE reviews');
    console.log('Reviews Table Schema:', rows);
  } catch (error) {
    console.error('Failed to describe table:', error);
  } finally {
    await pool.end();
  }
}

checkSchema();
