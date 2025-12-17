import { query, pool } from '../src/lib/db';
import * as dotenv from 'dotenv';
dotenv.config();

async function getOtp() {
  console.log('Fetching OTP...');
  try {
    const users = await query(
      `SELECT email, otp_code, otp_expires_at FROM admin_users WHERE email = ?`,
      ['heyitsdipesh@gmail.com']
    );

    if (users.length > 0) {
      console.log('\n==========================================');
      console.log(`LATEST OTP for ${users[0].email}:`);
      console.log(`CODE: ${users[0].otp_code}`);
      console.log(`EXPIRES: ${users[0].otp_expires_at}`);
      console.log('==========================================\n');
    } else {
      console.log('User not found.');
      // List all users to see if email matches
      const allUsers = await query('SELECT email FROM admin_users');
      console.log('Available users:', allUsers.map(u => u.email));
    }
  } catch (error) {
    console.error('Error fetching OTP:', error);
  } finally {
    await pool.end();
  }
}

getOtp();
