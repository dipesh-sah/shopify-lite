
import { execute } from '../src/lib/db';

async function migrate() {
  console.log('Migrating promotions table...');
  try {
    // Check if column exists or just try to add it (MySQL will error if exists but we catch it)
    await execute(`
      ALTER TABLE promotions
      ADD COLUMN rule_id VARCHAR(36) NULL AFTER is_active
    `);
    console.log('Successfully added rule_id column.');
  } catch (error: any) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Column rule_id already exists.');
    } else {
      console.error('Migration failed:', error);
    }
  }
}

migrate();
