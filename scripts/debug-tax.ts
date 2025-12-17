
import { calculateOrderTax } from '../src/lib/tax';
import { query } from '../src/lib/db';

async function run() {
  try {
    console.log('Fetching product...');
    const products = await query('SELECT * FROM products WHERE title LIKE ?', ['%Floral Dress%']);

    if (products.length === 0) {
      console.error('Product "Floral Dress" not found.');
      process.exit(1);
    }

    console.log('Fetching Product...');

    console.log('Fetching Tax Settings...');
    const { getTaxSettings } = require('../src/lib/settings');
    const settings = await getTaxSettings();
    console.log('Current Settings:', JSON.stringify(settings, null, 2));

    const product = products[0];
    console.log('Product Found:', { id: product.id, title: product.title, tax_class_id: product.tax_class_id, price: product.price });

    console.log('Fetching Tax Classes...');
    const classes = await query('SELECT * FROM tax_classes');
    console.log('Tax Classes:', JSON.stringify(classes, null, 2));

    console.log('Fetching Tax Rules...');
    const rules = await query('SELECT * FROM tax_rules');
    console.log('Tax Rules:', JSON.stringify(rules, null, 2));

    const items = [{
      productId: product.id.toString(),
      price: Number(product.price),
      quantity: 1
    }];

    const address = {
      country: 'US',
      state: 'NY',
      zip: '10001'
    };

    console.log('Calculating Tax for address:', address);

    const result = await calculateOrderTax(items, address, 0);

    console.log('Calculation Result:', JSON.stringify(result, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

run();
