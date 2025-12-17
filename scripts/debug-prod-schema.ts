
import { createPool } from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

async function showCreate() {
  const pool = createPool({ uri: process.env.DATABASE_URL });
  const [rows] = await pool.query("SHOW CREATE TABLE products");
  console.log("FULL SCHEMA:\n", (rows as any)[0]['Create Table']);
  await pool.end();
}
showCreate();
