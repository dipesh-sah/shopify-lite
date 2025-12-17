
import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function getDbConnection() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is not defined');
  }
  return createConnection(dbUrl);
}

async function migrateTaxes() {
  const connection = await getDbConnection();
  console.log('Starting Tax System Migration...');

  try {
    // 1. Create tax_classes table
    console.log('Creating tax_classes table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tax_classes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Seed default tax classes if empty
    const [classes] = await connection.query('SELECT COUNT(*) as count FROM tax_classes') as any[];
    if (classes[0].count === 0) {
      console.log('Seeding default tax classes...');
      await connection.execute(`
        INSERT INTO tax_classes (name, is_default) VALUES 
        ('Standard', TRUE),
        ('Reduced', FALSE),
        ('Zero Rated', FALSE)
      `);
    }

    // 2. Create tax_rules table
    console.log('Creating tax_rules table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tax_rules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        tax_class_id INT NOT NULL,
        country_code VARCHAR(10) NOT NULL, -- e.g. 'US', 'CA', '*'
        state_code VARCHAR(255), -- e.g. 'NY', 'CA' or '*' or NULL
        zip_code VARCHAR(255), -- e.g. '10001', '100*', '*'
        rate DECIMAL(10, 4) NOT NULL DEFAULT 0.0000,
        priority INT NOT NULL DEFAULT 0,
        is_compound BOOLEAN DEFAULT FALSE,
        is_shipping BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (tax_class_id) REFERENCES tax_classes(id) ON DELETE CASCADE
      )
    `);

    // 3. Modify products table
    console.log('Modifying products table...');
    try {
      // Check if column exists first to avoid error? Or just try add and catch specific error
      await connection.execute(`
            ALTER TABLE products ADD COLUMN tax_class_id INT NULL
        `);
      console.log('Added tax_class_id to products.');
    } catch (e: any) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('tax_class_id already exists in products.');
      } else {
        throw e;
      }
    }

    // Add FK constraint if not exists (hard to check easily in pure SQL without big query, skipping forceful add for now or use sensitive name)
    // Let's just try to add constraint, if it fails it might exist.
    // simpler: valid FK is good practice.
    /*
    try {
       await connection.execute(`ALTER TABLE products ADD CONSTRAINT fk_products_tax_class FOREIGN KEY (tax_class_id) REFERENCES tax_classes(id) ON DELETE SET NULL`);
    } catch(e) {} 
    */

    // 4. Modify orders table
    console.log('Modifying orders table...');
    const orderCols = [
      'tax_total DECIMAL(10, 2) DEFAULT 0.00',
      'tax_breakdown JSON'
    ];

    for (const colDef of orderCols) {
      try {
        const colName = colDef.split(' ')[0];
        await connection.execute(`ALTER TABLE orders ADD COLUMN ${colDef}`);
        console.log(`Added ${colName} to orders.`);
      } catch (e: any) {
        if (e.code !== 'ER_DUP_FIELDNAME') throw e;
        console.log(`${colDef.split(' ')[0]} already exists in orders.`);
      }
    }

    // 5. Modify order_items table
    console.log('Modifying order_items table...');
    const itemCols = [
      'tax_amount DECIMAL(10, 2) DEFAULT 0.00',
      'tax_rate DECIMAL(10, 4) DEFAULT 0.0000'
    ];

    for (const colDef of itemCols) {
      try {
        const colName = colDef.split(' ')[0];
        await connection.execute(`ALTER TABLE order_items ADD COLUMN ${colDef}`);
        console.log(`Added ${colName} to order_items.`);
      } catch (e: any) {
        if (e.code !== 'ER_DUP_FIELDNAME') throw e;
        console.log(`${colDef.split(' ')[0]} already exists in order_items.`);
      }
    }

    console.log('Tax System Migration Completed Successfully.');

  } catch (error) {
    console.error('Migration Failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

migrateTaxes();
