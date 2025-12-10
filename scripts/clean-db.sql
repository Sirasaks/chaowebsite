-- Create new table with clean schema (NO api type)
CREATE TABLE IF NOT EXISTS `products` (
    `id` int(11) NOT NULL AUTO_INCREMENT,
    `shop_id` int(11) NOT NULL DEFAULT 0,
    `name` varchar(255) NOT NULL,
    `price` varchar(50) NOT NULL,
    `description` text DEFAULT NULL,
    `type` enum('account', 'form') NOT NULL DEFAULT 'account',
    `image` varchar(500) DEFAULT NULL,
    `account` text DEFAULT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `slug` varchar(255) NOT NULL,
    `is_recommended` tinyint(1) DEFAULT 0,
    `display_order` int(11) DEFAULT 0,
    `is_active` tinyint(1) DEFAULT 1,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_slug_shop` (`slug`, `shop_id`),
    KEY `idx_shop_id` (`shop_id`),
    KEY `idx_products_recommended` (
        `is_recommended`,
        `display_order`
    )
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;