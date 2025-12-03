-- =====================================
-- Migration: Add API Order Handling Fields
-- =====================================
-- Purpose: Add fields to support pending state pattern for API orders
-- This prevents money loss from distributed transaction failures
-- Run Date: 2025-11-26
-- =====================================

-- Step 1: Add new status values to orders table
ALTER TABLE orders
MODIFY COLUMN status ENUM(
    'pending',
    'api_pending',
    'completed',
    'failed',
    'cancelled'
) DEFAULT 'pending';

-- Step 2: Add fields for idempotency and error tracking
ALTER TABLE orders
ADD COLUMN api_transaction_id VARCHAR(255) NULL COMMENT 'Unique transaction ID for idempotency',
ADD COLUMN retry_count INT DEFAULT 0 COMMENT 'Number of retry attempts for failed API calls',
ADD COLUMN last_error TEXT NULL COMMENT 'Last error message from API or database';

-- Step 3: Add index for faster idempotency checks
ALTER TABLE orders
ADD INDEX idx_api_transaction (api_transaction_id);

-- Step 4: Add index for finding pending/failed orders
ALTER TABLE orders ADD INDEX idx_status_created (status, created_at);

-- =====================================
-- Verification
-- =====================================
-- Run this to verify the changes:
-- DESCRIBE orders;
-- SHOW INDEX FROM orders WHERE Key_name LIKE 'idx_%';

-- =====================================
-- Rollback (if needed)
-- =====================================
-- ALTER TABLE orders DROP INDEX idx_status_created;
-- ALTER TABLE orders DROP INDEX idx_api_transaction;
-- ALTER TABLE orders DROP COLUMN last_error;
-- ALTER TABLE orders DROP COLUMN retry_count;
-- ALTER TABLE orders DROP COLUMN api_transaction_id;
-- ALTER TABLE orders MODIFY COLUMN status ENUM('pending','completed','cancelled') DEFAULT 'pending';