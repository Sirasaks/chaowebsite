-- =====================================
-- Database Schema for my-shop-v4
-- =====================================
-- This file contains all table schemas
-- Run this BEFORE creating indexes
-- =====================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    credit DECIMAL(10, 2) DEFAULT 0.00,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    image TEXT,
    product_ids JSON,
    is_recommended BOOLEAN DEFAULT FALSE,
    is_active TINYINT(1) DEFAULT 1,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    cost_price DECIMAL(10, 2),
    image TEXT,
    type ENUM('account', 'form', 'api') NOT NULL,
    account LONGTEXT,
    api_type_id VARCHAR(255),
    api_provider VARCHAR(50),
    is_auto_price BOOLEAN DEFAULT FALSE,
    is_recommended BOOLEAN DEFAULT FALSE,
    is_active TINYINT(1) DEFAULT 1,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    data LONGTEXT,
    status ENUM(
        'pending',
        'completed',
        'cancelled'
    ) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);

-- 5. Top-up History Table
CREATE TABLE IF NOT EXISTS topup_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    trans_ref VARCHAR(255) NOT NULL UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    sender_name VARCHAR(255),
    receiver_name VARCHAR(255),
    slip_image TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- 6. Settings Table
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(255) NOT NULL UNIQUE,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 7. Slideshow Table
CREATE TABLE IF NOT EXISTS slideshow (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    image_url TEXT NOT NULL,
    link_url TEXT,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 8. Password Reset Tokens Table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- =====================================
-- Initial Settings Data
-- =====================================

INSERT INTO
    settings (setting_key, setting_value)
VALUES ('site_name', 'My Shop'),
    (
        'site_description',
        'Digital Products Shop'
    ),
    ('primary_color', '#3b82f6'),
    ('secondary_color', '#8b5cf6'),
    ('truemoney_phone', ''),
    (
        'payment_truemoney_enabled',
        '1'
    ),
    (
        'payment_bank_transfer_enabled',
        '1'
    ),
    ('bank_name', 'ธนาคารกรุงเทพ'),
    ('bank_account_number', ''),
    ('bank_account_name', '')
ON DUPLICATE KEY UPDATE
    setting_value = VALUES(setting_value);

-- =====================================
-- Create Default Admin User
-- =====================================
-- Password: admin123 (Please change after first login!)
-- Hashed with bcrypt rounds=10

INSERT INTO
    users (
        username,
        email,
        password,
        full_name,
        role,
        credit
    )
VALUES (
        'admin',
        'admin@example.com',
        '$2b$10$rBV2kVqFZCkUxW6dJKQ.5eF4vY8lQ4K9vXxZc5sCf5pFk5M5vZGHe',
        'Administrator',
        'admin',
        0.00
    )
ON DUPLICATE KEY UPDATE
    username = username;

-- =====================================
-- Sample Categories (Optional)
-- =====================================

INSERT INTO
    categories (
        name,
        slug,
        image,
        is_recommended,
        is_active,
        display_order
    )
VALUES (
        'Netflix',
        'netflix',
        'https://via.placeholder.com/300x200?text=Netflix',
        TRUE,
        1,
        1
    ),
    (
        'YouTube Premium',
        'youtube-premium',
        'https://via.placeholder.com/300x200?text=YouTube',
        TRUE,
        1,
        2
    ),
    (
        'Spotify',
        'spotify',
        'https://via.placeholder.com/300x200?text=Spotify',
        TRUE,
        1,
        3
    )
ON DUPLICATE KEY UPDATE
    name = VALUES(name);

-- =====================================
-- Notes
-- =====================================
-- 1. After running this schema, run the indexes SQL file
-- 2. Update default admin password immediately
-- 3. Configure API keys in settings table or .env
-- 4. Set truemoney_phone for top-up functionality
-- 5. Upload actual category images after setup