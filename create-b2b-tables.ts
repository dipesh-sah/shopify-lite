import mysql from 'mysql2/promise';

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'shoplite',
  multipleStatements: true
};

async function createB2BTables() {
  let connection;

  try {
    console.log('🔗 Connecting to database...');
    connection = await mysql.createConnection(DB_CONFIG);

    console.log('📝 Creating b2b_applications table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS b2b_applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        company_registration_number VARCHAR(100),
        tax_id VARCHAR(100) COMMENT 'GST/VAT ID',
        business_type VARCHAR(100),
        website VARCHAR(255),
        annual_revenue DECIMAL(15, 2),
        employee_count INT,
        contact_person_name VARCHAR(255),
        contact_person_title VARCHAR(100),
        contact_phone VARCHAR(50),
        contact_email VARCHAR(255),
        business_address1 VARCHAR(255),
        business_address2 VARCHAR(255),
        business_city VARCHAR(100),
        business_province VARCHAR(100),
        business_country VARCHAR(100),
        business_zip VARCHAR(20),
        application_message TEXT COMMENT 'Why they want B2B account',
        expected_monthly_volume DECIMAL(15, 2),
        product_categories_interest JSON,
        status ENUM('pending', 'approved', 'rejected', 'under_review') DEFAULT 'pending',
        reviewed_at TIMESTAMP NULL,
        reviewed_by INT NULL COMMENT 'Admin user ID',
        review_notes TEXT,
        rejection_reason TEXT,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_customer_id (customer_id),
        INDEX idx_status (status),
        INDEX idx_submitted_at (submitted_at DESC)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ b2b_applications table created');

    console.log('📝 Creating b2b_approval_logs table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS b2b_approval_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        application_id INT NOT NULL,
        customer_id INT NOT NULL,
        action ENUM('submitted', 'under_review', 'approved', 'rejected', 'resubmitted') NOT NULL,
        performed_by INT NULL COMMENT 'Admin user ID',
        notes TEXT,
        metadata JSON COMMENT 'Additional context',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_application (application_id),
        INDEX idx_customer (customer_id),
        INDEX idx_action (action),
        INDEX idx_created_at (created_at DESC)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ b2b_approval_logs table created');

    console.log('📝 Adding customer_type column to customers table...');
    await connection.execute(`
      ALTER TABLE customers 
      ADD COLUMN IF NOT EXISTS customer_type ENUM('b2c', 'b2b') DEFAULT 'b2c' 
      AFTER email
    `).catch(err => console.log('Column might already exist:', err.message));

    console.log('📝 Adding company_id column to customers table...');
    await connection.execute(`
      ALTER TABLE customers 
      ADD COLUMN IF NOT EXISTS company_id INT NULL 
      AFTER customer_type
    `).catch(err => console.log('Column might already exist:', err.message));

    console.log('📝 Adding account_status column to customers table...');
    await connection.execute(`
      ALTER TABLE customers 
      ADD COLUMN IF NOT EXISTS account_status ENUM('active', 'pending', 'suspended', 'rejected') DEFAULT 'active' 
      AFTER is_active
    `).catch(err => console.log('Column might already exist:', err.message));

    console.log('\n✨ All b2b tables created successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createB2BTables()
  .then(() => {
    console.log('\n🎉 Database setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Setup failed:', error);
    process.exit(1);
  });
