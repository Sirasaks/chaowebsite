import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { mergeRealTimeStock, Product } from "@/lib/product-service";

export async function getHomepageData(shopId?: number) {
    const connection = await pool.getConnection();
    try {
        // Use parameterized queries to prevent SQL injection
        const safeShopId = shopId ?? -1; // Default to -1 if undefined (no results)

        const [
            [slideshow],
            [userResult],
            [productResult],
            [topupResult],
            [soldResult],
            [quickLinks],
            [categories],
            [products],
            [settingsResult]
        ] = await Promise.all([
            // 1. Fetch Slideshow
            connection.query<RowDataPacket[]>(
                "SELECT id, image_url, display_order FROM slideshow_images WHERE shop_id = ? ORDER BY display_order ASC, created_at DESC",
                [safeShopId]
            ),
            // 2. Fetch Stats
            connection.query<RowDataPacket[]>(
                "SELECT COUNT(*) as total_users FROM users WHERE shop_id = ?",
                [safeShopId]
            ),
            connection.query<RowDataPacket[]>(
                "SELECT COUNT(*) as total_products FROM products WHERE shop_id = ?",
                [safeShopId]
            ),
            connection.query<RowDataPacket[]>(
                "SELECT SUM(amount) as total_topup FROM topup_history WHERE shop_id = ? AND status = 'completed'",
                [safeShopId]
            ),
            connection.query<RowDataPacket[]>(
                "SELECT SUM(quantity) as total_sold FROM orders WHERE shop_id = ? AND status = 'completed'",
                [safeShopId]
            ),
            // 3. Fetch Quick Links
            connection.query<RowDataPacket[]>(
                "SELECT id, title, image_url, link_url, is_external, display_order FROM quick_links WHERE shop_id = ? ORDER BY display_order ASC",
                [safeShopId]
            ),
            // 4. Fetch Recommended Data
            connection.query<RowDataPacket[]>(
                "SELECT id, name, slug, image FROM categories WHERE is_recommended = TRUE AND (is_active = 1 OR is_active IS NULL) AND shop_id = ? ORDER BY display_order ASC, created_at DESC",
                [safeShopId]
            ),
            connection.query<RowDataPacket[]>(
                "SELECT id, name, slug, image, price, description, type, account, api_type_id, is_auto_price, (SELECT COALESCE(SUM(quantity), 0) FROM orders WHERE product_id = products.id AND status = 'completed') as sold FROM products WHERE is_recommended = TRUE AND is_active = 1 AND shop_id = ? ORDER BY display_order ASC, created_at DESC",
                [safeShopId]
            ),
            // 5. Fetch Announcement
            connection.query<RowDataPacket[]>(
                "SELECT announcement_text FROM site_settings WHERE shop_id = ?",
                [safeShopId]
            )
        ]);

        const stats = {
            totalUsers: userResult[0]?.total_users || 0,
            totalProducts: productResult[0]?.total_products || 0,
            totalTopup: topupResult[0]?.total_topup || 0,
            totalSold: soldResult[0]?.total_sold || 0,
        };

        // Merge real-time stock for API products
        // Merge real-time stock for API products
        const productsWithStock = await mergeRealTimeStock(products as unknown as Product[]);

        return {
            slideshow: slideshow as any[],
            stats,
            quickLinks: quickLinks as any[],
            categories: categories as any[],
            products: productsWithStock,
            announcement: settingsResult[0]?.announcement_text || ""
        };
    } finally {
        connection.release();
    }
}
