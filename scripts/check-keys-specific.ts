
import { query } from '../src/lib/db';

async function main() {
  try {
    const rows = await query('SELECT * FROM orders LIMIT 1');
    if (rows.length > 0) {
      const keys = Object.keys(rows[0]);
      console.log('Name related columns:', keys.filter(k => k.includes('name')).join(', '));
      console.log('Email related columns:', keys.filter(k => k.includes('email')).join(', '));
    } else {
      console.log('No Orders');
    }
  } catch (error) {
    console.error(error);
  }
}

main();
