// Run database migration for default variant support
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  let connection;

  try {
    // Parse DATABASE_URL: mysql://root:@localhost:3306/shoplite
    const dbUrl = process.env.DATABASE_URL || 'mysql://root:@localhost:3306/shoplite';
    const match = dbUrl.match(/mysql:\/\/([^:]+):([^@]*)@([^:]+):(\d+)\/(.+)/);

    if (!match) {
      throw new Error('Invalid DATABASE_URL format');
    }

    const [, user, password, host, port, database] = match;

    // Create connection
    connection = await mysql.createConnection({
      host,
      port: parseInt(port),
      user,
      password: password || '',
      database,
      multipleStatements: true
    });

    console.log(`✓ Connected to database: ${database}`);

    // Step 1: Add is_default column
    console.log('Step 1: Adding is_default column...');
    await connection.execute(`
      ALTER TABLE product_variants 
      ADD COLUMN is_default BOOLEAN DEFAULT FALSE
    `);
    console.log('✓ is_default column added');

    // Step 2: Add default_variant_id column
    console.log('Step 2: Adding default_variant_id column...');
    await connection.execute(`
      ALTER TABLE products 
      ADD COLUMN default_variant_id INT NULL
    `);
    console.log('✓ default_variant_id column added');

    // Step 3: Set first variant as default
    console.log('Step 3: Setting first variant as default...');
    await connection.execute(`
      UPDATE product_variants pv1
      SET is_default = TRUE
      WHERE id = (
        SELECT MIN(id) 
        FROM (SELECT * FROM product_variants) pv2 
        WHERE pv2.product_id = pv1.product_id
      )
    `);
    console.log('✓ First variants set as default');

    // Step 4: Update products with default variant
    console.log('Step 4: Updating products table...');
    await connection.execute(`
      UPDATE products p
      SET default_variant_id = (
        SELECT id 
        FROM product_variants 
        WHERE product_id = p.id AND is_default = TRUE 
        LIMIT 1
      )
    `);
    console.log('✓ Products updated with default variant');

    // Step 5: Add foreign key (try, but don't fail if exists)
    console.log('Step 5: Adding foreign key constraint...');
    try {
      await connection.execute(`
        ALTER TABLE products 
        ADD CONSTRAINT fk_default_variant
        FOREIGN KEY (default_variant_id) 
        REFERENCES product_variants(id) 
        ON DELETE SET NULL
      `);
      console.log('✓ Foreign key constraint added');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('✓ Foreign key already exists, skipping');
      } else {
        console.log('⚠ Foreign key creation failed (optional):', err.message);
      }
    }

    // Verify
    console.log('\nVerifying migration...');
    const [rows] = await connection.execute(`
      SELECT p.id, p.title, p.default_variant_id, pv.title as default_variant_title
      FROM products p
      LEFT JOIN product_variants pv ON p.default_variant_id = pv.id
      LIMIT 5
    `);

    console.log('\n✅ Migration completed successfully!');
    console.log('\nSample products with default variants:');
    console.table(rows);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ Database connection closed');
    }
  }
}

runMigration();
