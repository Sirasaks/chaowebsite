import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { mergeRealTimeStock, Product } from "@/lib/product-service";

export async function getHomepageData(shopId?: number) {
    const connection = await pool.getConnection();
    try {
        // Base WHERE clause
        const whereShop = shopId !== undefined ? `WHERE shop_id = ${shopId}` : "WHERE shop_id = -1"; // Default to no results if undefined to be safe
        const andShop = shopId !== undefined ? `AND shop_id = ${shopId}` : "AND shop_id = -1";

        // For stats, we need specific where clauses
        const whereShopStats = shopId !== undefined ? `WHERE shop_id = ${shopId}` : "WHERE shop_id = -1";
        const andShopStats = shopId !== undefined ? `AND shop_id = ${shopId}` : "AND shop_id = -1";

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
            connection.query<RowDataPacket[]>(`SELECT id, image_url, display_order FROM slideshow_images ${whereShop} ORDER BY display_order ASC, created_at DESC`),
            // 2. Fetch Stats
            connection.query<RowDataPacket[]>(`SELECT COUNT(*) as total_users FROM users ${whereShopStats}`),
            connection.query<RowDataPacket[]>(`SELECT COUNT(*) as total_products FROM products ${whereShopStats}`),
            connection.query<RowDataPacket[]>(`SELECT SUM(amount) as total_topup FROM topup_history ${whereShopStats ? whereShopStats + " AND" : "WHERE"} status = 'completed'`),
            connection.query<RowDataPacket[]>(`SELECT SUM(quantity) as total_sold FROM orders ${whereShopStats ? whereShopStats + " AND" : "WHERE"} status = 'completed'`),
            // 3. Fetch Quick Links
            connection.query<RowDataPacket[]>(`SELECT id, title, image_url, link_url, is_external, display_order FROM quick_links ${whereShop} ORDER BY display_order ASC`),
            // 4. Fetch Recommended Data
            connection.query<RowDataPacket[]>(`SELECT id, name, slug, image FROM categories WHERE is_recommended = TRUE AND (is_active = 1 OR is_active IS NULL) ${andShop} ORDER BY display_order ASC, created_at DESC`),
            connection.query<RowDataPacket[]>(`SELECT id, name, slug, image, price, description, type, account, api_type_id, is_auto_price, (SELECT COALESCE(SUM(quantity), 0) FROM orders WHERE product_id = products.id AND status = 'completed') as sold FROM products WHERE is_recommended = TRUE AND is_active = 1 ${andShop} ORDER BY display_order ASC, created_at DESC`)
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
