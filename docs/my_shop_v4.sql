-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 27, 2025 at 09:15 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

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

--
-- Database: `my_shop_v4`
--

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
    `id` int(11) NOT NULL,
    `name` varchar(255) NOT NULL,
    `slug` varchar(255) NOT NULL,
    `image` varchar(500) DEFAULT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `is_recommended` tinyint(1) DEFAULT 0,
    `display_order` int(11) DEFAULT 0,
    `product_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`product_ids`)),
    `is_active` tinyint(1) DEFAULT 1
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
    `id` int(11) NOT NULL,
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
    `api_transaction_id` varchar(255) DEFAULT NULL COMMENT 'Unique transaction ID for idempotency',
    `retry_count` int(11) DEFAULT 0 COMMENT 'Number of retry attempts for failed API calls',
    `last_error` text DEFAULT NULL COMMENT 'Last error message from API or database'
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
    `email` varchar(255) NOT NULL,
    `token` varchar(255) NOT NULL,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
    `id` int(11) NOT NULL,
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
    `api_provider` varchar(50) DEFAULT 'gafiw'
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
    `setting_key` varchar(255) NOT NULL,
    `setting_value` text DEFAULT NULL,
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `site_settings`
--

CREATE TABLE `site_settings` (
    `id` int(11) NOT NULL DEFAULT 1,
    `site_title` varchar(255) NOT NULL DEFAULT 'My Shop V4',
    `site_description` text DEFAULT NULL,
    `site_icon` text DEFAULT NULL,
    `site_logo` text DEFAULT NULL,
    `site_background` text DEFAULT NULL,
    `primary_color` varchar(50) NOT NULL DEFAULT '#ea580c',
    `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    `secondary_color` varchar(7) DEFAULT '#8b5cf6',
    `contact_link` varchar(255) DEFAULT ''
);

-- --------------------------------------------------------

--
-- Table structure for table `slideshow_images`
--

CREATE TABLE `slideshow_images` (
    `id` int(11) NOT NULL,
    `image_url` text NOT NULL,
    `display_order` int(11) DEFAULT 0,
    `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `topup_history`
--

CREATE TABLE `topup_history` (
    `id` int(11) NOT NULL,
    `user_id` int(11) NOT NULL,
    `trans_ref` varchar(255) NOT NULL,
    `amount` decimal(10, 2) NOT NULL,
    `sender_name` varchar(255) DEFAULT NULL,
    `receiver_name` varchar(255) DEFAULT NULL,
    `status` varchar(50) DEFAULT 'completed',
    `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
    `id` int(11) NOT NULL,
    `username` varchar(50) NOT NULL,
    `email` varchar(100) NOT NULL,
    `password` varchar(255) NOT NULL,
    `role` enum('user', 'owner') NOT NULL DEFAULT 'user',
    `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
    `credit` decimal(10, 2) NOT NULL DEFAULT 0.00
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
ADD PRIMARY KEY (`id`),
ADD UNIQUE KEY `slug_unique` (`slug`),
ADD KEY `idx_categories_recommended` (
    `is_recommended`,
    `display_order`
),
ADD KEY `idx_categories_active_recommended` (`is_active`, `is_recommended`),
ADD KEY `idx_categories_display_order` (`display_order`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
ADD PRIMARY KEY (`id`),
ADD KEY `idx_orders_created_at` (`created_at`),
ADD KEY `idx_orders_user_created` (`user_id`, `created_at`),
ADD KEY `idx_orders_product` (`product_id`),
ADD KEY `idx_api_transaction` (`api_transaction_id`),
ADD KEY `idx_status_created` (`status`, `created_at`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
ADD PRIMARY KEY (`token`),
ADD KEY `email` (`email`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
ADD PRIMARY KEY (`id`),
ADD UNIQUE KEY `slug_unique` (`slug`),
ADD KEY `idx_products_recommended` (
    `is_recommended`,
    `display_order`
),
ADD KEY `idx_products_type` (`type`),
ADD KEY `idx_products_active_recommended` (`is_active`, `is_recommended`),
ADD KEY `idx_products_display_order` (`display_order`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings` ADD PRIMARY KEY (`setting_key`);

--
-- Indexes for table `site_settings`
--
ALTER TABLE `site_settings` ADD PRIMARY KEY (`id`);

--
-- Indexes for table `slideshow_images`
--
ALTER TABLE `slideshow_images` ADD PRIMARY KEY (`id`);

--
-- Indexes for table `topup_history`
--
ALTER TABLE `topup_history`
ADD PRIMARY KEY (`id`),
ADD UNIQUE KEY `trans_ref` (`trans_ref`),
ADD KEY `idx_topup_created_at` (`created_at`),
ADD KEY `idx_topup_user_created` (`user_id`, `created_at`),
ADD KEY `idx_topup_status` (`status`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
ADD PRIMARY KEY (`id`),
ADD UNIQUE KEY `idx_username_unique` (`username`),
ADD UNIQUE KEY `idx_email_unique` (`email`),
ADD KEY `idx_users_role` (`role`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `slideshow_images`
--
ALTER TABLE `slideshow_images`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `topup_history`
--
ALTER TABLE `topup_history`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Constraints for table `topup_history`
--
ALTER TABLE `topup_history`
ADD CONSTRAINT `topup_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */
;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */
;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */
;