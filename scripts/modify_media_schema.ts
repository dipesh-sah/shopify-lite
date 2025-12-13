import { execute } from '../src/lib/db';

async function migrate() {
  console.log('Modifying product_images table...');
  try {
    await execute('ALTER TABLE product_images MODIFY product_id INT NULL');
    console.log('product_images table modified successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit();
  }
}

migrate();
