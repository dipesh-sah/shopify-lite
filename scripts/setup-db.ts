import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL is not defined in .env');
    process.exit(1);
  }

  console.log('Connecting to database...');
  // Create a connection without selecting a database first, if possible, or just connect
  // Note: DATABASE_URL usually includes the database name. 
  // If the database doesn't exist, this might fail depending on the provider.
  // For this script, we assume the database exists or the URL allows connection.

  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);

    console.log('Connected. Reading schema...');
    const schemaPath = path.join(__dirname, '../db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split by semicolon to get individual statements
    // This is a simple split and might break on semicolons in strings, but sufficient for this schema
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Found ${statements.length} statements to execute.`);

    for (const statement of statements) {
      try {
        await connection.query(statement);
      } catch (err) {
        console.error('Error executing statement:', statement);
        console.error(err);
      }
    }

    console.log('Database setup complete!');
    await connection.end();
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

setupDatabase();
