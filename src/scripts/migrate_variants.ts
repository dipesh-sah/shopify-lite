import * as dotenv from 'dotenv';
import path from 'path';

// Load env from root BEFORE importing db
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// import { execute } from '../lib/db';

console.log("DB URL defined?", !!process.env.DATABASE_URL);

async function modifyTable() {
  try {
    const { execute } = await import('../lib/db');
    console.log('Migrating product_variants table...');
    await execute(`ALTER TABLE product_variants ADD COLUMN images JSON DEFAULT NULL`);
    console.log("Successfully added 'images' column to 'product_variants' table.");
  } catch (e: any) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log("Column 'images' already exists in 'product_variants'.");
    } else {
      console.error("Migration failed:", e);
    }
  }
  process.exit(0);
}

modifyTable();
