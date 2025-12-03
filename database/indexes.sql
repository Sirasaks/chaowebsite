-- =====================================
-- Database Indexes for Performance
-- =====================================
-- Run this AFTER creating tables
-- These indexes optimize query performance
-- =====================================

-- Products Table Indexes
-- Optimize queries filtering by is_active and is_recommended
CREATE INDEX idx_products_active_recommended ON products (is_active, is_recommended);

-- Optimize product slug lookups (for /products/[slug])
CREATE INDEX idx_products_slug ON products (slug);

-- Optimize queries filtering by type
CREATE INDEX idx_products_type ON products(type);

-- Optimize sorting by display_order
CREATE INDEX idx_products_display_order ON products (display_order);

-- Categories Table Indexes
-- Optimize queries filtering by is_active and is_recommended
CREATE INDEX idx_categories_active_recommended ON categories (is_active, is_recommended);

-- Optimize category slug lookups (for /categories/[slug])
CREATE INDEX idx_categories_slug ON categories (slug);

-- Optimize sorting by display_order
CREATE INDEX idx_categories_display_order ON categories (display_order);

-- Orders Table Indexes
-- Optimize user order history queries
CREATE INDEX idx_orders_user_created ON orders (user_id, created_at DESC);

-- Optimize status filtering
CREATE INDEX idx_orders_status ON orders (status);

-- Optimize product-based queries
CREATE INDEX idx_orders_product ON orders (product_id);

-- Top-up History Table Indexes
-- Optimize user topup history queries
CREATE INDEX idx_topup_user_created ON topup_history (user_id, created_at DESC);

-- Optimize duplicate transaction checks
CREATE INDEX idx_topup_trans_ref ON topup_history (trans_ref);

-- Optimize status filtering
CREATE INDEX idx_topup_status ON topup_history (status);

-- Users Table Indexes
-- Username and email are already UNIQUE (automatic index)
-- Add index for role-based queries
CREATE INDEX idx_users_role ON users (role);

-- Settings Table Indexes
-- setting_key is already UNIQUE (automatic index)

-- Slideshow Table Indexes
-- Optimize active slideshow queries
CREATE INDEX idx_slideshow_active_order ON slideshow (is_active, display_order);

-- Password Reset Tokens Indexes
-- Optimize token lookup
CREATE INDEX idx_reset_token ON password_reset_tokens (token);

-- Optimize cleanup of expired tokens
CREATE INDEX idx_reset_expires ON password_reset_tokens (expires_at);

-- =====================================
-- Verify Indexes Created
-- =====================================
-- Run this to see all indexes:
-- SHOW INDEX FROM products;
-- SHOW INDEX FROM categories;
-- SHOW INDEX FROM orders;
-- SHOW INDEX FROM topup_history;
-- SHOW INDEX FROM users;
-- SHOW INDEX FROM slideshow;

-- =====================================
-- Performance Notes
-- =====================================
-- These indexes will significantly improve:
-- 1. Homepage queries (is_recommended + is_active)
-- 2. Category/Product page loads (slug lookups)
-- 3. User order history (user_id + created_at)
-- 4. Admin dashboard queries
-- 5. Duplicate transaction checks

-- Expected improvements:
-- - Homepage: 3-5x faster
-- - Product pages: 4-6x faster
-- - Order history: 5-10x faster