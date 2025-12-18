
import { query } from '../src/lib/db';

async function checkDescriptions() {
  try {
    const rows = await query('SELECT id, title, description, LENGTH(description) as len FROM products ORDER BY updated_at DESC LIMIT 5');
    console.log('--- Latest 5 Products ---');
    rows.forEach((r: any) => {
      console.log(`ID: ${r.id}`);
      console.log(`Title: ${r.title}`);
      console.log(`Desc: "${r.description}"`);
      console.log(`Len: ${r.len}`);
      console.log('-------------------------');
    });
  } catch (error) {
    console.error(error);
  }
}

checkDescriptions();
