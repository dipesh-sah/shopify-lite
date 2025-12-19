
import { execute, pool } from '../src/lib/db';

async function migrate() {
  try {
    console.log('Creating review_products table...');
    await execute(`
      CREATE TABLE IF NOT EXISTS review_products (
        review_id INT NOT NULL,
        product_id INT NOT NULL,
        PRIMARY KEY (review_id, product_id),
        FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    console.log('Migrating existing data...');
    // specific to mysql, INSERT IGNORE avoids duplicates if run multiple times
    await execute(`
      INSERT IGNORE INTO review_products (review_id, product_id)
      SELECT id, product_id FROM reviews WHERE product_id IS NOT NULL
    `);

    console.log('Migration complete.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrate();
