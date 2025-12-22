-- Migration: Add Default Variant Support
-- This migration adds support for default variant selection per product

-- Step 1: Add is_default column to product_variants
ALTER TABLE product_variants 
ADD COLUMN is_default BOOLEAN DEFAULT FALSE;

-- Step 2: Add default_variant_id to products table
ALTER TABLE products 
ADD COLUMN default_variant_id INT NULL;

-- Step 3: Set first variant as default for each product that has variants
UPDATE product_variants pv1
SET is_default = TRUE
WHERE id = (
  SELECT MIN(id) 
  FROM product_variants pv2 
  WHERE pv2.product_id = pv1.product_id
);

-- Step 4: Update products table with default variant reference
UPDATE products p
SET default_variant_id = (
  SELECT id 
  FROM product_variants 
  WHERE product_id = p.id AND is_default = TRUE 
  LIMIT 1
);

-- Step 5: Add foreign key constraint
ALTER TABLE products 
ADD CONSTRAINT fk_default_variant
FOREIGN KEY (default_variant_id) 
REFERENCES product_variants(id) 
ON DELETE SET NULL;

-- Step 6: Add unique index to ensure only one default per product
CREATE UNIQUE INDEX idx_default_variant 
ON product_variants(product_id, is_default) 
WHERE is_default = TRUE;

-- Verification queries
-- SELECT p.id, p.title, p.default_variant_id, pv.title as default_variant_title
-- FROM products p
-- LEFT JOIN product_variants pv ON p.default_variant_id = pv.id
-- LIMIT 10;
