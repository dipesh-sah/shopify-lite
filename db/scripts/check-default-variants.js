// Check if products have default_variant_id set
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDefaultVariants() {
  let connection;

  try {
    const dbUrl = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/shoplite';
    const match = dbUrl.match(/mysql:\/\/([^:]+):([^@]*)@([^:]+):(\d+)\/(.+)/);

    if (!match) {
      throw new Error('Invalid DATABASE_URL format');
    }

    const [, user, password, host, port, database] = match;

    connection = await mysql.createConnection({
      host,
      port: parseInt(port),
      user,
      password: password || '',
      database
    });

    console.log(`✓ Connected to database: ${database}\n`);

    // Check products with variants
    const [products] = await connection.execute(`
      SELECT 
        p.id, 
        p.title, 
        p.price as main_price,
        p.default_variant_id,
        dv.price as default_variant_price,
        dv.title as default_variant_title,
        (SELECT COUNT(*) FROM product_variants WHERE product_id = p.id) as variant_count
      FROM products p
      LEFT JOIN product_variants dv ON p.default_variant_id = dv.id
      WHERE p.status = 'active'
      LIMIT 10
    `);

    console.log('Products with variant info:');
    console.table(products);

    // Check if any products have variants but no default set
    const [noDefault] = await connection.execute(`
      SELECT p.id, p.title, COUNT(pv.id) as variant_count
      FROM products p
      JOIN product_variants pv ON p.product_id = pv.product_id
      WHERE p.default_variant_id IS NULL
      GROUP BY p.id
      LIMIT 5
    `);

    if (noDefault.length > 0) {
      console.log('\n⚠️ Products with variants but no default set:');
      console.table(noDefault);
    } else {
      console.log('\n✓ All products with variants have default set');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkDefaultVariants();
