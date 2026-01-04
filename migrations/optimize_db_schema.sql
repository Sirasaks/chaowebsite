-- 1. Modify products.price to DECIMAL(10,2) for better calculation and sorting
ALTER TABLE products
MODIFY COLUMN price DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

-- 2. Remove redundant product_ids column from categories (Normalization)
ALTER TABLE categories DROP COLUMN product_ids;

-- 3. Add Foreign Key to orders.user_id (Data Integrity)
-- First, verify if we need to clean up orphan records (optional, but safer)
-- UPDATE orders SET user_id = NULL WHERE user_id NOT IN (SELECT id FROM users);
-- Now add the constraint
ALTER TABLE orders
ADD CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL;