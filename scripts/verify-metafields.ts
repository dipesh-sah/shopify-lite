
import * as dotenv from 'dotenv';
import * as path from 'path';

// Mobile support: Load env vars first
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { createMetafieldDefinition, setMetafield, getMetafield, deleteMetafield } = require('../src/lib/metafields');
const { execute } = require('../src/lib/db');

async function verify() {
  console.log('Verifying Metafield Logic...');
  const testId = 'test-product-' + Date.now();

  try {
    // 1. Define
    console.log('1. Creating Definition...');
    const defId = await createMetafieldDefinition({
      namespace: 'custom',
      key: 'material',
      owner_type: 'product',
      type: 'single_line_text_field',
      name: 'Material',
      validation: { max: 255 }
    });
    console.log('   Definition created ID:', defId);

    // 2. Set Valid
    console.log('2. Setting Valid Metafield...');
    const mfId = await setMetafield('product', testId, 'custom', 'material', 'Cotton', 'single_line_text_field');
    console.log('   Metafield created ID:', mfId);

    // 3. Verify Read
    const read = await getMetafield('product', testId, 'custom', 'material');
    if (read.value === 'Cotton') console.log('   Read success:', read.value);
    else console.error('   Read mismatched:', read);

    // 4. Update
    console.log('4. Updating Metafield...');
    await setMetafield('product', testId, 'custom', 'material', 'Wool', 'single_line_text_field', 'Changed to Wool');
    const read2 = await getMetafield('product', testId, 'custom', 'material');
    if (read2.value === 'Wool') console.log('   Update success:', read2.value);

    // 5. Test Validation Fail
    console.log('5. Testing Validation Failure...');
    try {
      // Assuming validation logic checks types, let's try entering a number where string expected isn't failed by my logic yet (js is weird),
      // actually validateValue for 'single_line_text_field' checks typeof value === 'string'.
      await setMetafield('product', testId, 'custom', 'material', 12345, 'single_line_text_field');
      console.error('   ❌ Validation FAILED to catch error');
    } catch (e: any) {
      console.log('   ✅ Validation correctly failed:', e.message);
    }

    // Clean up
    await deleteMetafield(mfId);
    // await execute('DELETE FROM metafield_definitions WHERE id = ?', [defId]); // Keep definition or delete?

    console.log('Verification Completed.');
    process.exit(0);

  } catch (e) {
    console.error('Verification Failed:', e);
    process.exit(1);
  }
}

verify();
