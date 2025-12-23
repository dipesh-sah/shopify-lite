-- Add image column to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image VARCHAR(500) DEFAULT NULL AFTER description;
