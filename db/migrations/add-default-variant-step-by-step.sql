-- Run these queries ONE BY ONE in phpMyAdmin or MySQL Workbench
-- Copy and paste each query separately and execute

-- Query 1: Add is_default column
ALTER TABLE product_variants ADD COLUMN is_default BOOLEAN DEFAULT FALSE;

-- Query 2: Add default_variant_id column  
ALTER TABLE products ADD COLUMN default_variant_id INT NULL;

-- Query 3: Set first variant as default
UPDATE product_variants pv1
SET is_default = TRUE
WHERE id = (
  SELECT MIN(id) 
  FROM product_variants pv2 
  WHERE pv2.product_id = pv1.product_id
);

-- Query 4: Update products with default variant
UPDATE products p
SET default_variant_id = (
  SELECT id 
  FROM product_variants 
  WHERE product_id = p.id AND is_default = TRUE 
  LIMIT 1
);

-- Query 5: Add foreign key
ALTER TABLE products 
ADD CONSTRAINT fk_default_variant
FOREIGN KEY (default_variant_id) 
REFERENCES product_variants(id) 
ON DELETE SET NULL;

-- Query 6: Add unique index (may fail on some MySQL versions, that's OK)
CREATE UNIQUE INDEX idx_default_variant 
ON product_variants(product_id, is_default) 
WHERE is_default = TRUE;

-- Verify it worked:
SELECT p.id, p.title, p.default_variant_id 
FROM products p 
LIMIT 5;
