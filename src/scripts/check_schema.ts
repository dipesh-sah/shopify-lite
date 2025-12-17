
import dotenv from 'dotenv';
import { query } from '../lib/db';

dotenv.config();

async function checkSchema() {
  try {
    console.log('--- PRODUCTS TABLE ---');
    const products = await query("SHOW COLUMNS FROM products");
    console.table(products);

    console.log('--- PRODUCT VARIANTS TABLE ---');
    try {
      const variants = await query("SHOW COLUMNS FROM product_variants");
      console.table(variants);
    } catch (e) {
      console.log('product_variants table not found or error accessing it.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error checking schema:', error);
    process.exit(1);
  }
}

checkSchema();
