import { execute } from '../src/lib/db';
import * as dotenv from 'dotenv';
dotenv.config();

async function migrate() {
  console.log('Adding 2FA columns to admin_users...');
  try {
    await execute(`
      ALTER TABLE admin_users 
      ADD COLUMN two_factor_secret VARCHAR(255) NULL,
      ADD COLUMN two_factor_enabled TINYINT(1) DEFAULT 0
    `);
    console.log('Successfully added 2FA columns.');
  } catch (error: any) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Columns already exist, skipping.');
    } else {
      console.error('Migration failed:', error);
    }
  }
}

migrate().then(() => process.exit());
