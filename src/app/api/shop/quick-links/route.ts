import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getShopIdFromRequest } from "@/lib/shop-helper";
import { RowDataPacket } from "mysql2";

export async function GET(req: Request) {
    try {
        const shopId = await getShopIdFromRequest(req);
        if (!shopId) {
            return NextResponse.json({ error: "Shop not found" }, { status: 404 });
        }

        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT * FROM quick_links WHERE shop_id = ? ORDER BY display_order ASC",
            [shopId]
        );
        return NextResponse.json(rows);
    } catch (error) {
        console.error("Error fetching quick links:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
