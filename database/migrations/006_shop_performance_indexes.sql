-- Performance Indexes for Shop Section
-- Run this migration to improve query performance for shop pages

-- Index for filtering products by category (critical for category pages)
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products (category_id);

-- Index for product lookups by slug (critical for product details)
-- Note: Slug is already UNIQUE, which implies an index, but explicit index on (slug, shop_id) might help multi-tenant lookups
CREATE INDEX IF NOT EXISTS idx_products_slug_shop_id ON products (slug, shop_id);

-- Index for category lookups by slug
CREATE INDEX IF NOT EXISTS idx_categories_slug_shop_id ON categories (slug, shop_id);

-- Index for active products filtering
CREATE INDEX IF NOT EXISTS idx_products_shop_active ON products (shop_id, is_active);

-- Index for recommended products
CREATE INDEX IF NOT EXISTS idx_products_shop_recommended ON products (shop_id, is_recommended);