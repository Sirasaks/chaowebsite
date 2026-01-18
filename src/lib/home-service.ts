import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { unstable_cache } from "next/cache";

// --- Granular Data Fetching Functions ---

async function fetchShopSlideshow(shopId: number) {
    const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT id, image_url, display_order FROM slideshow_images WHERE shop_id = ? ORDER BY display_order ASC, created_at DESC",
        [shopId]
    );
    return rows as any[];
}

async function fetchShopStats(shopId: number) {
    const connection = await pool.getConnection();
    try {
        const [
            [userResult],
            [productResult],
            [topupResult],
            [soldResult]
        ] = await Promise.all([
            connection.query<RowDataPacket[]>("SELECT COUNT(*) as total_users FROM users WHERE shop_id = ?", [shopId]),
            connection.query<RowDataPacket[]>("SELECT COUNT(*) as total_products FROM products WHERE shop_id = ?", [shopId]),
            connection.query<RowDataPacket[]>("SELECT SUM(amount) as total_topup FROM topup_history WHERE shop_id = ? AND status = 'completed'", [shopId]),
            connection.query<RowDataPacket[]>("SELECT SUM(quantity) as total_sold FROM orders WHERE shop_id = ? AND status = 'completed'", [shopId]),
        ]);

        return {
            totalUsers: userResult[0]?.total_users || 0,
            totalProducts: productResult[0]?.total_products || 0,
            totalTopup: topupResult[0]?.total_topup || 0,
            totalSold: soldResult[0]?.total_sold || 0,
        };
    } finally {
        connection.release();
    }
}

async function fetchQuickLinks(shopId: number) {
    const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT id, title, image_url, link_url, is_external, display_order FROM quick_links WHERE shop_id = ? ORDER BY display_order ASC",
        [shopId]
    );
    return rows as any[];
}

async function fetchRecommendedCategories(shopId: number) {
    const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT id, name, slug, image FROM categories WHERE is_recommended = TRUE AND (is_active = 1 OR is_active IS NULL) AND shop_id = ? ORDER BY display_order ASC, created_at DESC",
        [shopId]
    );
    return rows as any[];
}

async function fetchRecommendedProducts(shopId: number) {
    // Optimized Query: explicit columns
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT p.id, p.name, p.slug, p.image, p.price, p.description, p.type, p.account, c.no_agent_discount,
        COALESCE(SUM(o.quantity), 0) as sold 
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN orders o ON o.product_id = p.id AND o.status = 'completed'
        WHERE p.is_recommended = TRUE AND p.is_active = 1 AND p.shop_id = ? 
        GROUP BY p.id, p.name, p.slug, p.image, p.price, p.description, p.type, p.account, c.no_agent_discount
        ORDER BY p.display_order ASC, p.created_at DESC`,
        [shopId]
    );

    return rows.map((p: any) => ({
        ...p,
        price: Number(p.price),
        // We set stock 0 here for list view performance, 
        // if real stock is needed it should be separate or calculated lighter
        stock: 0
    }));
}

async function fetchAnnouncement(shopId: number) {
    const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT announcement_text FROM site_settings WHERE shop_id = ?",
        [shopId]
    );
    return rows[0]?.announcement_text || "";
}

// --- Cached Exports ---

export const getShopSlideshow = unstable_cache(
    async (shopId: number) => fetchShopSlideshow(shopId),
    ['shop-slideshow'],
    { revalidate: 3600, tags: ['slideshow'] }
);

export const getShopStats = unstable_cache(
    async (shopId: number) => fetchShopStats(shopId),
    ['shop-stats'],
    { revalidate: 300, tags: ['stats'] } // Stats change often, 5 mins cache
);

export const getQuickLinks = unstable_cache(
    async (shopId: number) => fetchQuickLinks(shopId),
    ['shop-quicklinks'],
    { revalidate: 3600, tags: ['quick-links'] }
);

export const getRecommendedCategories = unstable_cache(
    async (shopId: number) => fetchRecommendedCategories(shopId),
    ['shop-categories-rec'],
    { revalidate: 3600, tags: ['categories'] }
);

export const getRecommendedProducts = unstable_cache(
    async (shopId: number) => fetchRecommendedProducts(shopId),
    ['shop-products-rec'],
    { revalidate: 60, tags: ['products'] } // Products change often, 60s cache
);

export const getAnnouncement = unstable_cache(
    async (shopId: number) => fetchAnnouncement(shopId),
    ['shop-announcement'],
    { revalidate: 3600, tags: ['settings'] }
);

// --- Legacy Monolith (For backward compat if needed, but we will move Page to use above) ---
export async function getHomepageData(shopId: number) {
    const [slideshow, stats, quickLinks, categories, products, announcement] = await Promise.all([
        getShopSlideshow(shopId),
        getShopStats(shopId),
        getQuickLinks(shopId),
        getRecommendedCategories(shopId),
        getRecommendedProducts(shopId),
        getAnnouncement(shopId)
    ]);

    return { slideshow, stats, quickLinks, categories, products, announcement };
}
