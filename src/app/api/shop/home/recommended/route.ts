import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getShopIdFromRequest } from "@/lib/shop-helper";
import { mergeRealTimeStock, Product } from "@/lib/product-service";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const shopId = await getShopIdFromRequest(req);
    if (!shopId) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const connection = await pool.getConnection();
    try {
        // Fetch recommended categories
        const [categories] = await connection.query<RowDataPacket[]>(
            "SELECT * FROM categories WHERE is_recommended = TRUE AND shop_id = ? ORDER BY display_order ASC, created_at DESC",
            [shopId]
        );

        // Fetch recommended products (only active ones)
        const [products] = await connection.query<RowDataPacket[]>(
            "SELECT * FROM products WHERE is_recommended = TRUE AND is_active = 1 AND shop_id = ? ORDER BY display_order ASC, created_at DESC",
            [shopId]
        );

        // Merge real-time stock for API products
        const productsWithStock = await mergeRealTimeStock(products as unknown as Product[]);

        return NextResponse.json({
            categories,
            products: productsWithStock
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
            }
        });
    } catch (error) {
        console.error("Fetch Recommended Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        connection.release();
    }
}
