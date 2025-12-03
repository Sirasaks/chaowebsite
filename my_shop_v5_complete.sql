-- My Shop V5 - Complete Multi-Tenant Database Schema

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

START TRANSACTION;

SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */
;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */
;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */
;
/*!40101 SET NAMES utf8mb4 */
;

-- --------------------------------------------------------
-- MASTER SYSTEM TABLES
-- --------------------------------------------------------

--
-- Table structure for table `master_users`
-- (For System Admin and Shop Owners)
--

CREATE TABLE `master_users` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `username` varchar(50) NOT NULL,
    `email` varchar(100) NOT NULL,
    `password` varchar(255) NOT NULL,
    `role` enum('user', 'admin') NOT NULL DEFAULT 'user', -- 'admin' = Super Admin, 'user' = Shop Owner
    `credit` decimal(10, 2) NOT NULL DEFAULT 0.00,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_master_username` (`username`),
    UNIQUE KEY `idx_master_email` (`email`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

--
-- Table structure for table `master_products`
-- (For Rental Packages)
--

CREATE TABLE `master_products` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `name` varchar(255) NOT NULL,
    `price` decimal(10, 2) NOT NULL,
    `duration_days` int(11) NOT NULL COMMENT 'Duration in days (e.g., 30, 365)',
    `description` text DEFAULT NULL,
    `is_active` tinyint(1) DEFAULT 1,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

--
-- Table structure for table `master_settings`
-- (For System API Keys, Payment Configs)
--

CREATE TABLE `master_settings` (
    `setting_key` varchar(255) NOT NULL,
    `setting_value` text DEFAULT NULL,
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`setting_key`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

--
-- Table structure for table `shops`
-- (Registry of all tenant shops)
--

CREATE TABLE `shops` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `subdomain` varchar(50) NOT NULL,
    `name` varchar(255) NOT NULL,
    `owner_id` int(11) NOT NULL, -- Links to master_users.id
    `expire_date` datetime DEFAULT NULL,
    `is_active` tinyint(1) DEFAULT 1,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `subdomain` (`subdomain`),
    KEY `idx_owner_id` (`owner_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- --------------------------------------------------------
-- SHOP SYSTEM TABLES (Multi-Tenant)
-- All tables here must have `shop_id`
-- --------------------------------------------------------

--
-- Table structure for table `users`
-- (For Shop Customers)
--

CREATE TABLE `users` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `shop_id` int(11) NOT NULL DEFAULT 0,
    `username` varchar(50) NOT NULL,
    `email` varchar(100) NOT NULL,
    `password` varchar(255) NOT NULL,
    `role` enum('user', 'owner') NOT NULL DEFAULT 'user',
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `credit` decimal(10, 2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_username_shop` (`username`, `shop_id`),
    UNIQUE KEY `idx_email_shop` (`email`, `shop_id`),
    KEY `idx_shop_id` (`shop_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `shop_id` int(11) NOT NULL DEFAULT 0,
    `name` varchar(255) NOT NULL,
    `slug` varchar(255) NOT NULL,
    `image` varchar(500) DEFAULT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `is_recommended` tinyint(1) DEFAULT 0,
    `display_order` int(11) DEFAULT 0,
    `product_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`product_ids`)),
    `is_active` tinyint(1) DEFAULT 1,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_slug_shop` (`slug`, `shop_id`),
    KEY `idx_shop_id` (`shop_id`),
    KEY `idx_categories_recommended` (
        `is_recommended`,
        `display_order`
    )
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `shop_id` int(11) NOT NULL DEFAULT 0,
    `name` varchar(255) NOT NULL,
    `price` varchar(50) NOT NULL,
    `description` text DEFAULT NULL,
    `image` varchar(500) DEFAULT NULL,
    `account` text DEFAULT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `slug` varchar(255) NOT NULL,
    `type` enum('account', 'form', 'api') NOT NULL DEFAULT 'account',
    `api_type_id` varchar(255) DEFAULT NULL,
    `is_auto_price` tinyint(1) DEFAULT 1,
    `is_recommended` tinyint(1) DEFAULT 0,
    `display_order` int(11) DEFAULT 0,
    `is_active` tinyint(1) DEFAULT 1,
    `api_provider` varchar(50) DEFAULT 'gafiw',
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_slug_shop` (`slug`, `shop_id`),
    KEY `idx_shop_id` (`shop_id`),
    KEY `idx_products_recommended` (
        `is_recommended`,
        `display_order`
    )
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `shop_id` int(11) NOT NULL DEFAULT 0,
    `user_id` int(11) DEFAULT NULL,
    `product_id` int(11) NOT NULL,
    `price` decimal(10, 2) NOT NULL,
    `quantity` int(11) NOT NULL,
    `data` text DEFAULT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `status` enum(
        'pending',
        'api_pending',
        'completed',
        'failed',
        'cancelled'
    ) DEFAULT 'pending',
    `note` text DEFAULT NULL,
    `api_transaction_id` varchar(255) DEFAULT NULL,
    `retry_count` int(11) DEFAULT 0,
    `last_error` text DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_shop_id` (`shop_id`),
    KEY `idx_orders_user_id` (`user_id`),
    KEY `idx_orders_created_at` (`created_at`),
    CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

--
-- Table structure for table `topup_history`
--

CREATE TABLE `topup_history` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `shop_id` int(11) NOT NULL DEFAULT 0,
    `user_id` int(11) NOT NULL,
    `trans_ref` varchar(255) NOT NULL,
    `amount` decimal(10, 2) NOT NULL,
    `sender_name` varchar(255) DEFAULT NULL,
    `receiver_name` varchar(255) DEFAULT NULL,
    `status` varchar(50) DEFAULT 'completed',
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    UNIQUE KEY `trans_ref` (`trans_ref`),
    KEY `idx_shop_id` (`shop_id`),
    KEY `idx_topup_user_id` (`user_id`),
    CONSTRAINT `topup_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
    `setting_key` varchar(255) NOT NULL,
    `shop_id` int(11) NOT NULL DEFAULT 0,
    `setting_value` text DEFAULT NULL,
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`setting_key`, `shop_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

--
-- Table structure for table `site_settings`
--

CREATE TABLE `site_settings` (
    `id` int(11) NOT NULL DEFAULT 1,
    `shop_id` int(11) NOT NULL DEFAULT 0,
    `site_title` varchar(255) NOT NULL DEFAULT 'My Shop',
    `site_description` text DEFAULT NULL,
    `site_icon` text DEFAULT NULL,
    `site_logo` text DEFAULT NULL,
    `site_background` text DEFAULT NULL,
    `primary_color` varchar(50) NOT NULL DEFAULT '#ea580c',
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    `secondary_color` varchar(7) DEFAULT '#8b5cf6',
    `contact_link` varchar(255) DEFAULT '',
    PRIMARY KEY (`id`),
    KEY `idx_shop_id` (`shop_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

--
-- Table structure for table `slideshow_images`
--

CREATE TABLE `slideshow_images` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `shop_id` int(11) NOT NULL DEFAULT 0,
    `image_url` text NOT NULL,
    `display_order` int(11) DEFAULT 0,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `idx_shop_id` (`shop_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

--
-- Table structure for table `quick_links`
--

CREATE TABLE `quick_links` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `shop_id` int(11) NOT NULL DEFAULT 0,
    `title` varchar(255) NOT NULL,
    `image_url` varchar(255) NOT NULL,
    `link_url` varchar(255) NOT NULL,
    `is_external` tinyint(1) DEFAULT 0,
    `display_order` int(11) NOT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (`id`),
    KEY `idx_shop_id` (`shop_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
    `email` varchar(255) NOT NULL,
    `token` varchar(255) NOT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (`token`),
    KEY `email` (`email`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */
;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */
;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */
;