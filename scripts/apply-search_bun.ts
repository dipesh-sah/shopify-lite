
import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function migrate() {
  console.log('Starting Search Index Migration (Bun)...');

  let connection;
  if (process.env.DATABASE_URL) {
    connection = await createConnection({ uri: process.env.DATABASE_URL });
  } else {
    connection = await createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "shopify_lite"
    });
  }

  try {
    // Check if index exists or just blindly attempt with try/catch
    try {
      await connection.query('CREATE FULLTEXT INDEX idx_products_title_desc ON products(title, description)');
      console.log('Added FULLTEXT index to products(title, description)');
    } catch (e: any) {
      if (e.code === 'ER_DUP_KEYNAME') console.log('Index idx_products_title_desc already exists');
      else console.log('Note on Index Creation:', e.message);
    }
  } catch (e) {
    console.error('Migration failed:', e);
  } finally {
    await connection.end();
  }
}

migrate();
