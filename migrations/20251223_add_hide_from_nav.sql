-- Migration: Add hide_from_nav column to categories
-- Description: Allows hiding categories/collections from the storefront navigation.

ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS hide_from_nav BOOLEAN DEFAULT FALSE AFTER is_active;
