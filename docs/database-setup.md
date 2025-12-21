# Database Setup Guide

## Overview
This guide explains how to set up the database for my-shop-v4 project.

## Prerequisites
- MySQL 5.7+ or MariaDB 10.3+
- Database created (e.g., `my_shop_db`)
- MySQL user with appropriate permissions

## Setup Steps

### Step 1: Create Database
```sql
CREATE DATABASE IF NOT EXISTS my_shop_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE my_shop_db;
```

### Step 2: Run Schema
```bash
mysql -u your_username -p my_shop_db < database/schema.sql
```

Or manually in MySQL/phpMyAdmin:
- Open `database/schema.sql`
- Copy and paste into SQL query window
- Execute

### Step 3: Run Indexes (for optimization)
```bash
mysql -u your_username -p my_shop_db < database/indexes.sql
```

### Step 4: Configure Environment
Update `.env.local`:
```env
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=my_shop_db
JWT_SECRET=your-super-secret-jwt-key-change-this
```

### Step 5: Change Default Admin Password
1. Login with:
   - Username: `admin`
   - Password: `admin123`
2. Navigate to Settings → Change Password
3. Set a strong password

## Database Tables

### Core Tables
1. **users** - User accounts and authentication
2. **categories** - Product categories
3. **products** - Digital products (accounts, forms, API items)
4. **orders** - Purchase history
5. **topup_history** - Credit top-up records

### Supporting Tables
6. **settings** - Application settings
7. **slideshow** - Homepage slideshow images
8. **password_reset_tokens** - Password reset functionality

## Important Fields

### Products Table
- `type`: 'account' | 'form' | 'api'
  - **account**: Pre-loaded items (e.g., accounts from text)
  - **form**: Custom form products
  - **api**: Products from external APIs
- `is_active`: 0 or 1 (controls visibility)
- `is_recommended`: Show on homepage
- `api_provider`: Provider name (e.g. 'custom')

### Categories Table
- `product_ids`: JSON array of product IDs in this category
- `is_active`: 0 or 1 (controls visibility)

## Post-Setup Tasks

### 1. Configure Payment Methods
Update in `settings` table or Admin Panel → Settings → Payment:
- TrueMoney phone number
- Bank account details
- Enable/disable payment methods

### 2. Configure API Keys
For external product APIs, configure them in the settings table.

### 3. Add Products
Go to Admin Panel → Products → Add products in each category

### 4. Upload Images
Replace placeholder images in categories with actual images

## Backup & Maintenance

### Create Backup
```bash
mysqldump -u your_username -p my_shop_db > backup_$(date +%Y%m%d).sql
```

### Restore Backup
```bash
mysql -u your_username -p my_shop_db < backup_20250126.sql
```

## Troubleshooting

### Connection Issues
- Check MySQL is running
- Verify credentials in `.env.local`
- Check firewall settings

### Migration Issues
- Ensure database charset is utf8mb4
- Check MySQL version compatibility
- Verify user permissions (CREATE, ALTER, INSERT, etc.)

## Security Notes

⚠️ **IMPORTANT:**
1. Change default admin password immediately
2. Use strong JWT_SECRET in production
3. Never commit `.env.local` to git
4. Use strong database passwords
5. Regularly backup your database
6. Keep MySQL/MariaDB updated

## Quick Reference

| Table | Primary Use |
|-------|-------------|
| users | Authentication, credit balance |
| products | Product catalog |
| categories | Product organization |
| orders | Sales records |
| topup_history | Credit transactions |
| settings | System configuration |

---

**Need help?** Check the main README.md or create an issue in the repository.
