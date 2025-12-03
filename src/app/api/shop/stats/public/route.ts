import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getShopIdFromRequest } from "@/lib/shop-helper";

export async function GET(req: Request) {
    try {
        const shopId = await getShopIdFromRequest(req);
        if (!shopId) {
            return NextResponse.json({ error: "Shop not found" }, { status: 404 });
        }

        // 1. Total Users
        const [userResult] = await pool.query<RowDataPacket[]>(
            "SELECT COUNT(*) as total_users FROM users WHERE shop_id = ?",
            [shopId]
        );
        const totalUsers = userResult[0].total_users || 0;

        // 2. Total Products
        const [productResult] = await pool.query<RowDataPacket[]>(
            "SELECT COUNT(*) as total_products FROM products WHERE shop_id = ?",
            [shopId]
        );
        const totalProducts = productResult[0].total_products || 0;

        // 3. Total Top-up Amount
        const [topupResult] = await pool.query<RowDataPacket[]>(
            "SELECT SUM(amount) as total_topup FROM topup_history WHERE status = 'completed' AND shop_id = ?",
            [shopId]
        );
        const totalTopup = topupResult[0].total_topup || 0;

        // 4. Total Sold
        const [soldResult] = await pool.query<RowDataPacket[]>(
            "SELECT SUM(quantity) as total_sold FROM orders WHERE status = 'completed' AND shop_id = ?",
            [shopId]
        );
        const totalSold = soldResult[0].total_sold || 0;

        return NextResponse.json({
            totalUsers,
            totalProducts,
            totalTopup,
            totalSold
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
            }
        });

    } catch (error: any) {
        console.error("Fetch Public Stats Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
