
import dotenv from 'dotenv';
import path from 'path';

// Load env from current directory
dotenv.config();

async function createAddressesTable() {
  try {
    const { execute } = await import('../lib/db');

    console.log('Creating addresses table...');

    // Schema based on implementation plan
    const createSql = `
      CREATE TABLE IF NOT EXISTS addresses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        company VARCHAR(255),
        address1 VARCHAR(255) NOT NULL,
        address2 VARCHAR(255),
        city VARCHAR(255) NOT NULL,
        province VARCHAR(255),
        zip VARCHAR(20) NOT NULL,
        country VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      )
    `;

    await execute(createSql);
    console.log('Addresses table created successfully.');

    process.exit(0);
  } catch (error) {
    console.error('Error creating addresses table:', error);
    process.exit(1);
  }
}

createAddressesTable();
