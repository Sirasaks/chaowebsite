import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { mergeRealTimeStock, Product } from "@/lib/product-service";

export async function getHomepageData() {
    const connection = await pool.getConnection();
    try {
        const [
            [slideshow],
            [userResult],
            [productResult],
            [topupResult],
            [soldResult],
            [quickLinks],
            [categories],
            [products]
        ] = await Promise.all([
            // 1. Fetch Slideshow
            connection.query<RowDataPacket[]>("SELECT id, image_url, display_order FROM slideshow_images ORDER BY display_order ASC, created_at DESC"),
            // 2. Fetch Stats
            connection.query<RowDataPacket[]>("SELECT COUNT(*) as total_users FROM users"),
            connection.query<RowDataPacket[]>("SELECT COUNT(*) as total_products FROM products"),
            connection.query<RowDataPacket[]>("SELECT SUM(amount) as total_topup FROM topup_history WHERE status = 'completed'"),
            connection.query<RowDataPacket[]>("SELECT SUM(quantity) as total_sold FROM orders WHERE status = 'completed'"),
            // 3. Fetch Quick Links
            connection.query<RowDataPacket[]>("SELECT id, title, image_url, link_url, is_external, display_order FROM quick_links ORDER BY display_order ASC"),
            // 4. Fetch Recommended Data
            connection.query<RowDataPacket[]>("SELECT id, name, slug, image FROM categories WHERE is_recommended = TRUE AND (is_active = 1 OR is_active IS NULL) ORDER BY display_order ASC, created_at DESC"),
            connection.query<RowDataPacket[]>("SELECT id, name, slug, image, price, description, type, account, api_type_id, is_auto_price FROM products WHERE is_recommended = TRUE AND is_active = 1 ORDER BY display_order ASC, created_at DESC")
        ]);

        const stats = {
            totalUsers: userResult[0]?.total_users || 0,
            totalProducts: productResult[0]?.total_products || 0,
            totalTopup: topupResult[0]?.total_topup || 0,
            totalSold: soldResult[0]?.total_sold || 0,
        };

        // Merge real-time stock for API products
        const productsWithStock = await mergeRealTimeStock(products as unknown as Product[]);

        return {
            slideshow: slideshow as any[],
            stats,
            quickLinks: quickLinks as any[],
            categories: categories as any[],
            products: productsWithStock
        };
    } finally {
        connection.release();
    }
}
