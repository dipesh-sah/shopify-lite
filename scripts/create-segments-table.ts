
import { execute } from '../src/lib/db';

async function migrate() {
  console.log('Migrating customer_segments table...');
  try {
    await execute('DROP TABLE IF EXISTS customer_segments');
    await execute(`
      CREATE TABLE customer_segments (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        query TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Successfully created customer_segments table.');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrate();
