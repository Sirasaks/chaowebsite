-- Performance Indexes for Master Section
-- Run this migration to improve query performance

-- Index for shops.owner_id (used in history query)
CREATE INDEX IF NOT EXISTS idx_shops_owner_id ON shops (owner_id);

-- Index for master_orders.shop_id (used in JOIN)
CREATE INDEX IF NOT EXISTS idx_master_orders_shop_id ON master_orders (shop_id);

-- Composite index for orders.shop_id (used in JOIN)
CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON orders (shop_id);

-- Index for faster shop lookup by subdomain
CREATE INDEX IF NOT EXISTS idx_shops_subdomain ON shops (subdomain);

-- Index for users by shop_id (multi-tenant queries)
CREATE INDEX IF NOT EXISTS idx_users_shop_id ON users (shop_id);

-- Index for products by shop_id
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products (shop_id);