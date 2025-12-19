
import { execute, pool } from '../src/lib/db';

async function reset() {
  console.log('Resetting reviews table...');

  try {
    await execute('DROP TABLE IF EXISTS reviews');
    console.log('Dropped old table.');

    await execute(`
      CREATE TABLE reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        content TEXT NOT NULL,
        author_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        status ENUM('active', 'inactive') DEFAULT 'inactive',
        is_verified BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        INDEX idx_product_id (product_id), -- For filtering by product
        INDEX idx_status (status),         -- For filtering public active reviews
        INDEX idx_rating (rating),         -- For sorting/filtering
        INDEX idx_created_at (created_at)  -- For sorting recent
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Created new reviews table with correct schema.');

  } catch (error) {
    console.error('Reset failed:', error);
  } finally {
    await pool.end();
  }
}

reset();
