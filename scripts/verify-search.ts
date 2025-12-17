
import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function verify() {
  console.log('Verifying Search and Filters...');
  const { getProducts } = await import('../src/lib/products');

  // Test Search
  console.log('\n--- Test Search "Test" ---');
  const res1 = await getProducts({ search: 'Test', limit: 5 });
  console.log(`Found ${res1.products.length} products matching "Test". Total: ${res1.totalCount}`);
  res1.products.forEach((p: any) => console.log(` - ${p.title} (${p.sku})`));

  // Test Min Price
  console.log('\n--- Test Min Price 50 ---');
  const res2 = await getProducts({ minPrice: 50, limit: 5 });
  console.log(`Found ${res2.products.length} products with price >= 50. Total: ${res2.totalCount}`);
  res2.products.forEach((p: any) => console.log(` - ${p.title}: $${p.price}`));

  process.exit(0);
}

verify();
