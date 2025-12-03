-- Optimized Indexes Script
-- Products: Optimize filtering by type
CREATE INDEX idx_products_type ON products(type);
-- Products: Optimize sorting by display_order
CREATE INDEX idx_products_display_order ON products (display_order);
-- Categories: Optimize sorting by display_order
CREATE INDEX idx_categories_display_order ON categories (display_order);
-- Orders: Optimize user history (filtering by user, sorting by date)
CREATE INDEX idx_orders_user_created ON orders (user_id, created_at);
-- Orders: Optimize status filtering and sorting
CREATE INDEX idx_status_created ON orders (status, created_at);
-- Orders: Optimize product lookups
CREATE INDEX idx_orders_product ON orders (product_id);
-- Orders: Optimize API transaction lookups
CREATE INDEX idx_api_transaction ON orders (api_transaction_id);
-- Topup History: Optimize user history
CREATE INDEX idx_topup_user_created ON topup_history (user_id, created_at);
-- Topup History: Optimize status filtering
CREATE INDEX idx_topup_status ON topup_history (status);
-- Users: Optimize role-based queries
CREATE INDEX idx_users_role ON users (role);
-- Slideshow: Optimize ordering
-- CREATE INDEX idx_slideshow_order ON slideshow_images (display_order);