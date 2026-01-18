-- Refresh Tokens Table for Token Rotation
-- Run this migration to enable token rotation feature

-- For Shop Users
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    shop_id INT,
    token_hash VARCHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (shop_id) REFERENCES shops (id) ON DELETE CASCADE,
    INDEX idx_token_hash (token_hash),
    INDEX idx_user_expires (user_id, expires_at),
    INDEX idx_cleanup (expires_at, revoked)
);

-- For Master Users
CREATE TABLE IF NOT EXISTS master_refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES master_users (id) ON DELETE CASCADE,
    INDEX idx_token_hash (token_hash),
    INDEX idx_user_expires (user_id, expires_at),
    INDEX idx_cleanup (expires_at, revoked)
);

-- Cleanup job (run periodically via cron or scheduled task)
-- DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked = TRUE;
-- DELETE FROM master_refresh_tokens WHERE expires_at < NOW() OR revoked = TRUE;