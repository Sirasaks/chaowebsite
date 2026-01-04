-- Migration: Add is_deleted column to users table and credit_logs table
-- Run this SQL in your database

-- 1. Modify users role column to include 'agent'
ALTER TABLE users
MODIFY COLUMN role ENUM('user', 'agent', 'owner') NOT NULL DEFAULT 'user';

-- 2. Add is_deleted column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_deleted TINYINT(1) DEFAULT 0;

-- 2. Add agent_discount column to users table (per-user discount percentage)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS agent_discount DECIMAL(5, 2) DEFAULT 0;

-- 3. Create credit_logs table for tracking credit changes
CREATE TABLE IF NOT EXISTS credit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shop_id INT NOT NULL,
    user_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    type ENUM('add', 'subtract') NOT NULL,
    note VARCHAR(255) NULL,
    admin_id INT NULL,
    balance_before DECIMAL(10, 2) NOT NULL,
    balance_after DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_shop_id (shop_id),
    FOREIGN KEY (shop_id) REFERENCES shops (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES users (id) ON DELETE SET NULL
);

-- 4. Add index for is_deleted
CREATE INDEX IF NOT EXISTS idx_users_is_deleted ON users (is_deleted);