import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getShopIdFromRequest } from "@/lib/shop-helper";
import { Product } from "@/lib/product-service";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const shopId = await getShopIdFromRequest(req);
    if (!shopId) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const connection = await pool.getConnection();
    try {
        // Fetch categories and products in parallel for better performance
        const [[categories], [products]] = await Promise.all([
            connection.query<RowDataPacket[]>(
                "SELECT id, name, slug, image, display_order FROM categories WHERE is_recommended = TRUE AND (is_active = 1 OR is_active IS NULL) AND shop_id = ? ORDER BY display_order ASC, created_at DESC",
                [shopId]
            ),
            connection.query<RowDataPacket[]>(
                `SELECT id, name, slug, image, price, description, type 
                 FROM products 
                 WHERE is_recommended = TRUE AND is_active = 1 AND shop_id = ? 
                 ORDER BY display_order ASC, created_at DESC`,
                [shopId]
            )
        ]);

        const productsWithStock = products.map(p => ({ ...p, price: Number(p.price), stock: 0 }));

        return NextResponse.json({
            categories,
            products: productsWithStock
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
            }
        });
    } catch (error) {
        console.error("Fetch Recommended Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        connection.release();
    }
}
