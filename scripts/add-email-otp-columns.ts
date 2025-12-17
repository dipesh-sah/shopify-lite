import { execute } from '../src/lib/db';
import * as dotenv from 'dotenv';
dotenv.config();

async function migrate() {
  console.log('Adding Email OTP columns to admin_users...');
  try {
    await execute(`
      ALTER TABLE admin_users 
      ADD COLUMN otp_code VARCHAR(6) NULL,
      ADD COLUMN otp_expires_at DATETIME NULL
    `);
    console.log('Successfully added otp_code and otp_expires_at columns.');
  } catch (error: any) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Columns already exist, skipping.');
    } else {
      console.error('Migration failed:', error);
    }
  }
}

migrate().then(() => process.exit());
