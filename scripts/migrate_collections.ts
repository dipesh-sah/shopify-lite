
import { query, execute } from '../src/lib/db';

async function migrate() {
  console.log('Starting migration for product_collections...');

  try {
    // 1. Create product_collections table
    await execute(`
      CREATE TABLE IF NOT EXISTS product_collections (
        product_id INT NOT NULL,
        collection_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (product_id, collection_id),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (collection_id) REFERENCES categories(id) ON DELETE CASCADE
      )
    `);
    console.log('Created product_collections table.');

    // 2. Migrate existing category_id from products table
    // Fetch products with non-null category_id
    const products = await query('SELECT id, category_id FROM products WHERE category_id IS NOT NULL');

    console.log(`Found ${products.length} products to migrate.`);

    for (const p of products) {
      if (p.category_id) {
        try {
          await execute(
            'INSERT IGNORE INTO product_collections (product_id, collection_id) VALUES (?, ?)',
            [p.id, p.category_id]
          );
        } catch (err) {
          console.error(`Failed to migrate product ${p.id} collection ${p.category_id}:`, err);
        }
      }
    }

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
