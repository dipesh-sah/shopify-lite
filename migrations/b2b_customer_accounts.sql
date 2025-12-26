-- ============================================================
-- B2C/B2B CUSTOMER ACCOUNTS MIGRATION (SIMPLIFIED)
-- ============================================================

USE shoplite;

-- Step 1: Add customer_type to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_type ENUM('b2c', 'b2b') DEFAULT 'b2c' AFTER email;

-- Step 2: Add company_id to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER customer_type;

-- Step 3: Add account_status to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS account_status ENUM('active', 'pending', 'suspended', 'rejected') DEFAULT 'active' AFTER is_active;

-- Step 4: Add approved_at to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL AFTER account_status;

-- Step 5: Add approved_by to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS approved_by INT NULL COMMENT 'Admin user ID who approved' AFTER approved_at;

-- Step 6: Create indexes on customers table
CREATE INDEX IF NOT EXISTS idx_customer_type ON customers(customer_type);

CREATE INDEX IF NOT EXISTS idx_account_status ON customers(account_status);

CREATE INDEX IF NOT EXISTS idx_company_id ON customers(company_id);

-- Step 7: Create B2B Applications table
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
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_submitted_at (submitted_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 8: Add B2B fields to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS minimum_order_value DECIMAL(10, 2) DEFAULT 0.00 AFTER ordering_status;

ALTER TABLE companies ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(15, 2) DEFAULT 0.00 AFTER minimum_order_value;

ALTER TABLE companies ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5, 2) DEFAULT 0.00 COMMENT 'Global discount for this company' AFTER payment_terms;

ALTER TABLE companies ADD COLUMN IF NOT EXISTS tax_exempt BOOLEAN DEFAULT FALSE AFTER tax_settings;

ALTER TABLE companies ADD COLUMN IF NOT EXISTS notes TEXT AFTER tax_exempt;

-- Step 9: Create B2B Product Pricing table
CREATE TABLE IF NOT EXISTS b2b_product_pricing (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    variant_id INT NULL COMMENT 'NULL means applies to all variants',
    company_id INT NULL COMMENT 'NULL means applies to all B2B customers',
    customer_id INT NULL COMMENT 'Customer-specific pricing (highest priority)',
    price DECIMAL(10, 2) NOT NULL,
    min_quantity INT DEFAULT 1 COMMENT 'Minimum order quantity',
    max_quantity INT NULL COMMENT 'Max quantity for this price tier',
    pricing_type ENUM('fixed', 'percentage', 'tiered') DEFAULT 'fixed',
    discount_percentage DECIMAL(5, 2) NULL COMMENT 'If pricing_type is percentage',
    tier_name VARCHAR(100) NULL,
    tier_priority INT DEFAULT 0,
    valid_from TIMESTAMP NULL,
    valid_until TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NULL COMMENT 'Admin user ID',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_product_pricing (product_id, company_id),
    INDEX idx_variant_pricing (variant_id, company_id),
    INDEX idx_customer_pricing (customer_id, product_id),
    INDEX idx_active (is_active),
    INDEX idx_validity (valid_from, valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 10: Create Minimum Order Quantities table
CREATE TABLE IF NOT EXISTS minimum_order_quantities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    variant_id INT NULL,
    company_id INT NULL COMMENT 'NULL means global MOQ for B2B',
    customer_type ENUM('b2c', 'b2b', 'all') DEFAULT 'all',
    min_quantity INT NOT NULL DEFAULT 1,
    increment_quantity INT DEFAULT 1 COMMENT 'Must order in multiples of this',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_product_moq (product_id, customer_type),
    INDEX idx_company_moq (company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 11: Create Customer Price Groups table
CREATE TABLE IF NOT EXISTS customer_price_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    discount_type ENUM('percentage', 'fixed') DEFAULT 'percentage',
    discount_value DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 12: Create Customer Price Group Members table
CREATE TABLE IF NOT EXISTS customer_price_group_members (
    customer_id INT NOT NULL,
    price_group_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by INT NULL COMMENT 'Admin user ID',
    PRIMARY KEY (customer_id, price_group_id),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (price_group_id) REFERENCES customer_price_groups(id) ON DELETE CASCADE,
    INDEX idx_price_group (price_group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 13: Create B2B Approval Logs table
CREATE TABLE IF NOT EXISTS b2b_approval_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    customer_id INT NOT NULL,
    action ENUM('submitted', 'under_review', 'approved', 'rejected', 'resubmitted') NOT NULL,
    performed_by INT NULL COMMENT 'Admin user ID',
    notes TEXT,
    metadata JSON COMMENT 'Additional context',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES b2b_applications(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    INDEX idx_application (application_id),
    INDEX idx_customer (customer_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 14: Add B2B fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_type ENUM('b2c', 'b2b', 'guest') DEFAULT 'guest' AFTER customer_email;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS company_id INT NULL AFTER customer_type;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS purchase_order_number VARCHAR(100) NULL COMMENT 'B2B PO number' AFTER company_id;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(50) NULL AFTER payment_status;

-- Step 15: Create indexes on orders table
CREATE INDEX IF NOT EXISTS idx_customer_type_orders ON orders(customer_type);

CREATE INDEX IF NOT EXISTS idx_company_orders ON orders(company_id);

-- Step 16: Insert default price groups
INSERT INTO customer_price_groups (name, description, discount_type, discount_value, is_active) VALUES
('Wholesale - Standard', 'Standard wholesale pricing - 10% off', 'percentage', 10.00, TRUE),
('Wholesale - Premium', 'Premium wholesale pricing - 15% off', 'percentage', 15.00, TRUE),
('Wholesale - VIP', 'VIP wholesale pricing - 20% off', 'percentage', 20.00, TRUE),
('Retail', 'Standard retail pricing', 'percentage', 0.00, TRUE)
ON DUPLICATE KEY UPDATE name=name;

SELECT 'B2C/B2B Migration Complete!' as status;
