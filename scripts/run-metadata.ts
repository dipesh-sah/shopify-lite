
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env vars FIRST
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
  try {
    // Dynamic import to ensure env vars are loaded
    const { migrateMetadata } = require('./migrate-metadata');
    await migrateMetadata();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

run();
