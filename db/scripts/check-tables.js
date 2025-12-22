// Check database tables
const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTables() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'shopify_lite'
    });

    console.log('✓ Connected to database\n');

    // Show all tables
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('All tables in database:');
    console.table(tables);

    // Check for variant-related tables
    console.log('\nLooking for variant tables...');
    const variantTables = tables.filter(t =>
      Object.values(t)[0].toLowerCase().includes('variant')
    );

    if (variantTables.length > 0) {
      console.log('Found variant tables:');
      console.table(variantTables);

      // Describe the variant table
      const tableName = Object.values(variantTables[0])[0];
      console.log(`\nStructure of ${tableName}:`);
      const [structure] = await connection.execute(`DESCRIBE ${tableName}`);
      console.table(structure);
    } else {
      console.log('❌ No variant tables found');
    }

    // Check products table
    console.log('\nStructure of products table:');
    const [productsStructure] = await connection.execute('DESCRIBE products');
    console.table(productsStructure);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTables();
