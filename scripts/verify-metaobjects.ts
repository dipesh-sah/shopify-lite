
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { defineMetaobject, createMetaobject, getMetaobject, deleteMetaobject } = require('../src/lib/metaobjects');
const { execute } = require('../src/lib/db');

async function verify() {
  console.log('Verifying Metaobject Logic...');

  try {
    // 1. Define Type
    const type = 'designer';
    console.log(`1. Defining Metaobject Type: ${type}...`);
    // Check if exists/clean up from previous runs?
    // For simplicity, we assume clean or ignore duplicate error for this test
    // Actually our code inserts, so unique constraint on type might hit.
    // Let's ensure cleanup in finally block or use random type.

    const randomType = 'designer_' + Date.now();

    await defineMetaobject(randomType, 'Designer', [
      { key: 'name', type: 'single_line_text_field', name: 'Name' },
      { key: 'bio', type: 'multi_line_text_field', name: 'Biography' },
      { key: 'founded_year', type: 'number_integer', name: 'Founded Year' }
    ]);
    console.log('   Definition created.');

    // 2. Create Instance
    console.log('2. Creating Instance...');
    const handle = 'gucci-' + Date.now();
    const id = await createMetaobject(randomType, handle, 'Gucci', {
      name: 'Gucci',
      bio: 'Luxury fashion house.',
      founded_year: 1921
    });
    console.log('   Instance created ID:', id);

    // 3. Retrieve
    console.log('3. Retrieving Instance...');
    const obj = await getMetaobject(handle);
    if (obj) {
      console.log('   Retrieved:', obj.display_name);
      console.log('   Fields:', obj.fields);

      if (obj.fields.founded_year === 1921 || obj.fields.founded_year === '1921') {
        console.log('   ✅ Field verification passed.');
      } else {
        console.error('   ❌ Field verification FAILED. Got:', obj.fields.founded_year);
      }
    } else {
      console.error('   ❌ Failed to retrieve object.');
    }

    // Cleanup
    await deleteMetaobject(id);
    console.log('   Cleanup done.');

    process.exit(0);
  } catch (e) {
    console.error('Verification Failed:', e);
    process.exit(1);
  }
}

verify();
