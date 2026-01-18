-- Performance Optimization Indexes
-- Run this script on your MySQL database to improve query performance

-- Index for products queries (homepage, category pages)
CREATE INDEX IF NOT EXISTS idx_products_shop_recommended ON products (
    shop_id,
    is_recommended,
    is_active
);

-- Index for products by category
CREATE INDEX IF NOT EXISTS idx_products_category ON products (
    category_id,
    shop_id,
    is_active
);

-- Index for orders aggregation (sold count)
CREATE INDEX IF NOT EXISTS idx_orders_product_status ON orders (product_id, status);

-- Index for categories queries
CREATE INDEX IF NOT EXISTS idx_categories_shop_recommended ON categories (
    shop_id,
    is_recommended,
    is_active
);

-- Index for topup history
CREATE INDEX IF NOT EXISTS idx_topup_shop_status ON topup_history (shop_id, status);

-- Index for users by shop
CREATE INDEX IF NOT EXISTS idx_users_shop ON users (shop_id);

-- Verify indexes were created
SHOW INDEX FROM products;

SHOW INDEX FROM orders;

SHOW INDEX FROM categories;