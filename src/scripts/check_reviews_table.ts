
import dotenv from 'dotenv';
import path from 'path';

// Load env from current directory
dotenv.config();

console.log('Env loaded. DB URL length:', process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 'undefined');

async function checkAndCreateTable() {
  try {
    const { query, execute } = await import('../lib/db');

    console.log('Checking database connection...');
    // Simple query to test connection
    await query('SELECT 1');
    console.log('Database connected.');

    const result = await query("SHOW TABLES LIKE 'reviews'");
    console.log('Table check result:', result);

    if (result.length > 0) {
      console.log('Reviews table already exists.');
      const columns = await query("SHOW COLUMNS FROM reviews");
      console.log('Columns:', columns);
    } else {
      console.log('Reviews table does not exist. Creating...');

      const createSql = `
          CREATE TABLE reviews (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            customer_name VARCHAR(255) NOT NULL,
            customer_email VARCHAR(255),
            rating INT NOT NULL,
            title VARCHAR(255),
            content TEXT,
            status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
          )
        `;

      await execute(createSql);
      console.log('Reviews table created successfully.');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAndCreateTable();
