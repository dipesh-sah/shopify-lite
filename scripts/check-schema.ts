
import { query } from '../src/lib/db';

async function main() {
  try {
    const rows = await query('DESCRIBE orders');
    console.log('Orders Table Schema:');
    rows.forEach((r: any) => console.log(`${r.Field} (${r.Type})`));
  } catch (error) {
    console.error('Failed to describe table:', error);
  }
}

main();
