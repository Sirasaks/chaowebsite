-- Add is_active column to categories table
-- Default value is 1 (active)
-- This allows administrators to disable categories without deleting them

ALTER TABLE categories ADD COLUMN is_active TINYINT(1) DEFAULT 1;

-- Optional: Update existing categories to be active by default (if needed)
-- UPDATE categories SET is_active = 1 WHERE is_active IS NULL;