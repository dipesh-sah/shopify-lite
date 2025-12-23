const mysql = require('mysql2/promise');

async function addImageColumn() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345678',
    database: 'shopify_lite'
  });

  try {
    await connection.execute(`
      ALTER TABLE categories 
      ADD COLUMN IF NOT EXISTS image VARCHAR(500) DEFAULT NULL AFTER description
    `);
    console.log('✅ Image column added successfully to categories table');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

addImageColumn();
