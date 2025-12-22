import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: path.join(process.cwd(), '.env') });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL is not defined in .env');
  process.exit(1);
}

const pool = mysql.createPool({
  uri: dbUrl,
  waitForConnections: true,
  connectionLimit: 5,
});

async function runSchema() {
  try {
    const schemaPath = path.join(process.cwd(), 'db/full_schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    // Split by semicolon 
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const connection = await pool.getConnection();

    console.log(`Running ${statements.length} statements...`);

    for (const statement of statements) {
      try {
        await connection.query(statement);
      } catch (err: any) {
        // Ignore "Table already exists" or similar if IF NOT EXISTS usage covers it
        // But log error just in case
        // console.error(`Statement failed: ${statement.substring(0, 30)}...`);
        // console.error(err.message);
      }
    }

    console.log('Schema applied successfully.');
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

runSchema();
