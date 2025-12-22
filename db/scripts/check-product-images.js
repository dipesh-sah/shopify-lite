const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabase() {
  let connection;

  try {
    const dbUrl = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/shoplite';
    console.log('DATABASE_URL:', dbUrl);

    const match = dbUrl.match(/mysql:\/\/([^:]+):([^@]*)@([^:]+):(\d+)\/(.+)/);

    if (!match) {
      throw new Error('Invalid DATABASE_URL format');
    }

    const [, user, password, host, port, database] = match;

    console.log(`Connecting to: ${database}`);

    connection = await mysql.createConnection({
      host,
      port: parseInt(port),
      user,
      password: password || '',
      database
    });

    console.log(`✓ Connected to database: ${database}\n`);

    // Check products table
    const [products] = await connection.execute(`
      SELECT id, title, price, status 
      FROM products 
      LIMIT 3
    `);

    console.log('Sample products:');
    console.table(products);

    // Check product_images
    const [images] = await connection.execute(`
      SELECT pi.id, pi.product_id, pi.url, p.title as product_title
      FROM product_images pi
      JOIN products p ON pi.product_id = p.id
      LIMIT 5
    `);

    console.log('\nProduct images:');
    console.table(images);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkDatabase();
