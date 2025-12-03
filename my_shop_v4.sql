-- Full Database Schema v8 (Symmetric Master & Shop)
-- Concept: Master is just a "Shop" that sells "Websites".

-- ==========================================
-- GROUP 1: MASTER SYSTEM (SaaS Management)
-- Structure mirrors Shop System for consistency
-- ==========================================

-- 1.1 Master Users (ลูกค้าที่มาเช่าเว็บ)
CREATE TABLE `master_users` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `username` varchar(50) NOT NULL,
    `email` varchar(100) NOT NULL,
    `password` varchar(255) NOT NULL,
    `role` enum('super_admin', 'user') NOT NULL DEFAULT 'user', -- user = tenant
    `credit` decimal(10, 2) NOT NULL DEFAULT 0.00,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `username` (`username`),
    UNIQUE KEY `email` (`email`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 1.2 Master Products (แพ็กเกจเช่าเว็บ) -> เหมือน shop_products
CREATE TABLE `master_products` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `name` varchar(255) NOT NULL, -- e.g. "Starter Plan"
    `price` decimal(10, 2) NOT NULL,
    `image` varchar(500) DEFAULT NULL,
    `description` text,
    `duration_days` int(11) NOT NULL DEFAULT 30, -- Special field for rental
    `is_active` tinyint(1) DEFAULT 1,
    `display_order` int(11) DEFAULT 0,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 1.3 Master Orders (ประวัติการซื้อแพ็กเกจ) -> เหมือน shop_orders
CREATE TABLE `master_orders` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `user_id` int(11) NOT NULL, -- Link to master_users.id
    `product_id` int(11) NOT NULL,
    `price` decimal(10, 2) NOT NULL,
    `status` enum(
        'pending',
        'completed',
        'failed'
    ) DEFAULT 'pending',
    `data` text, -- เก็บข้อมูลร้านที่สร้าง (subdomain, shop_name)
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `idx_user` (`user_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 1.4 Master Topup History (ประวัติเติมเงินเข้าระบบ Master) -> เหมือน shop_topup_history
CREATE TABLE `master_topup_history` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `user_id` int(11) NOT NULL,
    `trans_ref` varchar(255) NOT NULL,
    `amount` decimal(10, 2) NOT NULL,
    `status` varchar(50) DEFAULT 'completed',
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `idx_user` (`user_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 1.5 Shops (ทะเบียนร้านค้าที่ถูกสร้างขึ้น)
CREATE TABLE `shops` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `owner_id` int(11) NOT NULL, -- Link to master_users.id
    `subdomain` varchar(50) NOT NULL,
    `name` varchar(255) NOT NULL,
    `expire_date` datetime DEFAULT NULL,
    `is_active` tinyint(1) DEFAULT 1,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `subdomain` (`subdomain`),
    KEY `idx_owner` (`owner_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- ==========================================
-- GROUP 2: SHOP SYSTEM (E-commerce for End Users)
-- ==========================================

-- 2.1 Shop Users
CREATE TABLE `shop_users` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `shop_id` int(11) NOT NULL,
    `username` varchar(50) NOT NULL,
    `email` varchar(100) NOT NULL,
    `password` varchar(255) NOT NULL,
    `role` enum('user', 'admin') NOT NULL DEFAULT 'user',
    `credit` decimal(10, 2) NOT NULL DEFAULT 0.00,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_username_shop` (`username`, `shop_id`),
    KEY `idx_shop` (`shop_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 2.2 Shop Products
CREATE TABLE `shop_products` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `shop_id` int(11) NOT NULL,
    `name` varchar(255) NOT NULL,
    `price` decimal(10, 2) NOT NULL,
    `image` varchar(500) DEFAULT NULL,
    `description` text,
    `type` enum('account', 'code', 'service') NOT NULL DEFAULT 'account',
    `stock_data` text,
    `slug` varchar(255) NOT NULL,
    `is_active` tinyint(1) DEFAULT 1,
    `is_recommended` tinyint(1) DEFAULT 0,
    `display_order` int(11) DEFAULT 0,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_slug_shop` (`slug`, `shop_id`),
    KEY `idx_shop` (`shop_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 2.3 Shop Orders
CREATE TABLE `shop_orders` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `shop_id` int(11) NOT NULL,
    `user_id` int(11) NOT NULL,
    `product_id` int(11) NOT NULL,
    `price` decimal(10, 2) NOT NULL,
    `quantity` int(11) NOT NULL,
    `status` enum(
        'pending',
        'completed',
        'failed'
    ) DEFAULT 'pending',
    `data` text,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `idx_shop` (`shop_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 2.4 Shop Topup History
CREATE TABLE `shop_topup_history` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `shop_id` int(11) NOT NULL,
    `user_id` int(11) NOT NULL,
    `trans_ref` varchar(255) NOT NULL,
    `amount` decimal(10, 2) NOT NULL,
    `status` varchar(50) DEFAULT 'completed',
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `idx_shop` (`shop_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 2.5 Shop Categories
CREATE TABLE `shop_categories` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `shop_id` int(11) NOT NULL,
    `name` varchar(255) NOT NULL,
    `slug` varchar(255) NOT NULL,
    `image` varchar(500) DEFAULT NULL,
    `is_recommended` tinyint(1) DEFAULT 0,
    `display_order` int(11) DEFAULT 0,
    `is_active` tinyint(1) DEFAULT 1,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_slug_shop` (`slug`, `shop_id`),
    KEY `idx_shop` (`shop_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 2.6 Shop Settings
CREATE TABLE `shop_settings` (
    `shop_id` int(11) NOT NULL,
    `setting_key` varchar(255) NOT NULL,
    `setting_value` text,
    PRIMARY KEY (`shop_id`, `setting_key`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 2.7 Shop Site Settings
CREATE TABLE `shop_site_settings` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `shop_id` int(11) NOT NULL,
    `site_title` varchar(255) DEFAULT 'My Shop',
    `site_logo` text,
    `primary_color` varchar(50) DEFAULT '#ea580c',
    PRIMARY KEY (`id`),
    KEY `idx_shop` (`shop_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 2.8 Shop Slideshow Images
CREATE TABLE `shop_slideshow_images` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `shop_id` int(11) NOT NULL,
    `image_url` text NOT NULL,
    `display_order` int(11) DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_shop` (`shop_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 2.9 Shop Quick Links
CREATE TABLE `shop_quick_links` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `shop_id` int(11) NOT NULL,
    `title` varchar(255) NOT NULL,
    `link_url` varchar(255) NOT NULL,
    `image_url` varchar(255) NOT NULL,
    `display_order` int(11) DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_shop` (`shop_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;