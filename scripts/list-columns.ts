
import { query } from '../src/lib/db';

async function main() {
  try {
    const rows = await query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders'
    `);
    console.log('Columns in orders table:', rows.map((r: any) => r.COLUMN_NAME).join(', '));
  } catch (error) {
    console.error('Failed to get schema:', error);
  }
}

main();
