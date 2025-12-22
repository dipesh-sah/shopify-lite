-- Migration: Add hierarchical and multi-language support to categories
-- Description: Adds parent-child relationships, positioning, and a translation table for multi-language content.

-- 1. Create translations table
CREATE TABLE IF NOT EXISTS category_translations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    locale VARCHAR(10) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    meta_title VARCHAR(255),
    meta_description TEXT,
    slug VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY idx_category_locale (category_id, locale),
    UNIQUE KEY idx_slug_locale (slug, locale),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- 2. Add hierarchical and positioning columns to categories
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS parent_id INT NULL AFTER id,
ADD COLUMN IF NOT EXISTS position INT DEFAULT 0 AFTER parent_id,
ADD COLUMN IF NOT EXISTS level INT DEFAULT 0 AFTER position,
ADD COLUMN IF NOT EXISTS path TEXT AFTER level,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE AFTER status,
ADD CONSTRAINT fk_category_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL;

-- 3. Initial data migration (Move existing names/descriptions to translations)
-- Assuming 'en-GB' as default locale
INSERT IGNORE INTO category_translations (category_id, locale, name, description, meta_title, meta_description, slug)
SELECT id, 'en-GB', name, description, seo_title, seo_description, slug
FROM categories;

-- 4. Cleanup categories table (Optional: remove old columns after verification)
-- ALTER TABLE categories DROP COLUMN name, DROP COLUMN description, DROP COLUMN seo_title, DROP COLUMN seo_description, DROP COLUMN slug;
