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

        // Run all queries in parallel for better performance
        const [
            [userResult],
            [productResult],
            [topupResult],
            [soldResult]
        ] = await Promise.all([
            pool.query<RowDataPacket[]>(
                "SELECT COUNT(*) as total_users FROM users WHERE shop_id = ?",
                [shopId]
            ),
            pool.query<RowDataPacket[]>(
                "SELECT COUNT(*) as total_products FROM products WHERE shop_id = ?",
                [shopId]
            ),
            pool.query<RowDataPacket[]>(
                "SELECT SUM(amount) as total_topup FROM topup_history WHERE status = 'completed' AND shop_id = ?",
                [shopId]
            ),
            pool.query<RowDataPacket[]>(
                "SELECT SUM(quantity) as total_sold FROM orders WHERE status = 'completed' AND shop_id = ?",
                [shopId]
            ),
        ]);

        return NextResponse.json({
            totalUsers: userResult[0]?.total_users || 0,
            totalProducts: productResult[0]?.total_products || 0,
            totalTopup: topupResult[0]?.total_topup || 0,
            totalSold: soldResult[0]?.total_sold || 0
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
            }
        });

    } catch (error: any) {
        console.error("Fetch Public Stats Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
