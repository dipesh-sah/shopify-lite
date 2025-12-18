
import { updateProduct, getProduct, createProduct } from '../src/lib/products';
import { query } from '../src/lib/db';

async function verifyUpdateFlow() {
  try {
    console.log('--- Starting Update Flow Verification ---');

    // 1. Create a dummy product
    console.log('1. Creating test product...');
    const id = await createProduct({
      title: 'Test Product ' + Date.now(),
      slug: 'test-product-' + Date.now(),
      price: 100,
      trackQuantity: false,
      quantity: 0,
      weightUnit: 'kg',
      collections: [],
      collectionIds: [],
      images: [],
      status: 'draft',
      description: 'Initial Description'
    });
    console.log(`   Created Product ID: ${id}`);

    // 2. Read it back
    const initial = await getProduct(id);
    console.log(`2. Initial Read: "${initial?.description}"`);
    if (initial?.description !== 'Initial Description') {
      throw new Error('Initial description mismatch!');
    }

    // 3. Update description
    console.log('3. Updating description...');
    const newDesc = 'Updated Description ' + Date.now();
    await updateProduct(id, { description: newDesc });

    // 4. Read it back again
    const updated = await getProduct(id);
    console.log(`4. Updated Read: "${updated?.description}"`);

    if (updated?.description !== newDesc) {
      console.error('❌ FAILED: Description did not update!');
      console.error(`   Expected: "${newDesc}"`);
      console.error(`   Got: "${updated?.description}"`);
    } else {
      console.log('✅ SUCCESS: Description updated correctly in DB.');
    }

    // Cleanup
    await query('DELETE FROM products WHERE id = ?', [id]);
    console.log('5. Cleanup done.');

  } catch (error) {
    console.error('❌ ERROR:', error);
  }
}

verifyUpdateFlow();
