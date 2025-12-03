import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getShopIdFromRequest } from "@/lib/shop-helper";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const shopId = await getShopIdFromRequest(req);
    if (!shopId) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query<RowDataPacket[]>(
            "SELECT * FROM slideshow_images WHERE shop_id = ? ORDER BY display_order ASC, created_at DESC",
            [shopId]
        );
        return NextResponse.json(rows, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
            }
        });
    } catch (error) {
        console.error("Fetch Slideshow Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        connection.release();
    }
}
