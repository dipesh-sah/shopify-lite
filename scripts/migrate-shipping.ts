
import { execute, query } from '../src/lib/db';

export async function migrateShipping() {
  console.log('Migrating Shipping Tables...');

  // 1. Shipping Zones
  await execute(`
    CREATE TABLE IF NOT EXISTS shipping_zones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      countries JSON, 
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // 2. Shipping Methods
  await execute(`
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

  // 3. Shipping Rates
  await execute(`
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

  // 4. Update Orders Table
  try {
    await execute(`ALTER TABLE orders ADD COLUMN shipping_method_id INT`);
  } catch (e: any) {
    if (e.code !== 'ER_DUP_FIELDNAME') console.log('Note: shipping_method_id might already exist');
  }

  try {
    await execute(`ALTER TABLE orders ADD COLUMN shipping_cost DECIMAL(10, 2) DEFAULT 0.00`);
  } catch (e: any) {
    if (e.code !== 'ER_DUP_FIELDNAME') console.log('Note: shipping_cost might already exist');
  }

  // 5. Seed Default Data if empty
  const zones = await query('SELECT * FROM shipping_zones');
  if (Array.isArray(zones) && zones.length === 0) {
    console.log('Seeding default shipping zone...');
    const result: any = await execute('INSERT INTO shipping_zones (name, countries) VALUES (?, ?)', ['Domestic', JSON.stringify(['US', 'NP'])]); // Defaulting to simple list
    const zoneId = result.insertId;

    const methodRes: any = await execute('INSERT INTO shipping_methods (zone_id, name, description) VALUES (?, ?, ?)', [zoneId, 'Standard Shipping', '3-5 Business Days']);
    const methodId = methodRes.insertId;

    await execute('INSERT INTO shipping_rates (method_id, rate, min_price) VALUES (?, ?, ?)', [methodId, 5.00, 0]);
    await execute('INSERT INTO shipping_rates (method_id, rate, min_price) VALUES (?, ?, ?)', [methodId, 0.00, 100]); // Free shipping over $100
  }

  console.log('Shipping Migration Completed.');
}
