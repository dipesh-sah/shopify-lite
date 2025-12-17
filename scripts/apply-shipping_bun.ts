
import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function migrate() {
  console.log('Starting Shipping Migration (Bun)...');

  let connection;
  if (process.env.DATABASE_URL) {
    connection = await createConnection({ uri: process.env.DATABASE_URL, multipleStatements: true });
  } else {
    connection = await createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "shopify_lite",
      multipleStatements: true
    });
  }

  try {
    // 1. Shipping Zones
    await connection.query(`
        CREATE TABLE IF NOT EXISTS shipping_zones (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          countries JSON, 
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
    console.log('Checked shipping_zones');

    // 2. Shipping Methods
    await connection.query(`
        CREATE TABLE IF NOT EXISTS shipping_methods (
          id INT AUTO_INCREMENT PRIMARY KEY,
          zone_id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (zone_id) REFERENCES shipping_zones(id) ON DELETE CASCADE
        )
      `);
    console.log('Checked shipping_methods');

    // 3. Shipping Rates
    await connection.query(`
        CREATE TABLE IF NOT EXISTS shipping_rates (
          id INT AUTO_INCREMENT PRIMARY KEY,
          method_id INT NOT NULL,
          name VARCHAR(255),
          min_weight DECIMAL(10, 2) DEFAULT 0,
          max_weight DECIMAL(10, 2),
          min_price DECIMAL(10, 2) DEFAULT 0,
          max_price DECIMAL(10, 2),
          rate DECIMAL(10, 2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (method_id) REFERENCES shipping_methods(id) ON DELETE CASCADE
        )
      `);
    console.log('Checked shipping_rates');

    // 4. Update Orders Table
    try {
      await connection.query(`ALTER TABLE orders ADD COLUMN shipping_method_id INT`);
      console.log('Added shipping_method_id to orders');
    } catch (e: any) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.log('shipping_method_id might already exist');
    }

    try {
      await connection.query(`ALTER TABLE orders ADD COLUMN shipping_cost DECIMAL(10, 2) DEFAULT 0.00`);
      console.log('Added shipping_cost to orders');
    } catch (e: any) {
      if (e.code !== 'ER_DUP_FIELDNAME') console.log('shipping_cost might already exist');
    }

    // 5. Seed
    const [zones]: any = await connection.query('SELECT * FROM shipping_zones');
    if (zones.length === 0) {
      console.log('Seeding default data...');
      const [res]: any = await connection.query('INSERT INTO shipping_zones (name, countries) VALUES (?, ?)', ['Domestic', JSON.stringify(['US', 'NP'])]);
      const zoneId = res.insertId;

      const [mRes]: any = await connection.query('INSERT INTO shipping_methods (zone_id, name, description) VALUES (?, ?, ?)', [zoneId, 'Standard Shipping', '3-5 Days']);
      const methodId = mRes.insertId;

      await connection.query('INSERT INTO shipping_rates (method_id, rate, min_price) VALUES (?, ?, ?)', [methodId, 15.00, 0]);
      await connection.query('INSERT INTO shipping_rates (method_id, rate, min_price) VALUES (?, ?, ?)', [methodId, 0.00, 1000]);
    }

  } catch (e) {
    console.error('Migration failed:', e);
  } finally {
    await connection.end();
  }
}

migrate();
