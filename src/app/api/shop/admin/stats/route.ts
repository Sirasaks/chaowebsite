import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { RowDataPacket } from "mysql2";
import { getJwtSecret } from "@/lib/env";
import { getShopIdFromRequest } from "@/lib/shop-helper";

export async function GET(request: Request) {
    try {
        const shopId = await getShopIdFromRequest(request);
        if (!shopId) {
            return NextResponse.json({ error: "Shop not found" }, { status: 404 });
        }

        // Authenticate Admin
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decoded = jwt.verify(token, getJwtSecret()) as { userId: number };
        const [users] = await pool.query<RowDataPacket[]>("SELECT role FROM users WHERE id = ?", [decoded.userId]);

        if (users.length === 0 || users[0].role !== "owner") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // 1. Total Top-up Amount
        const [topupResult] = await pool.query<RowDataPacket[]>(
            "SELECT SUM(amount) as total_topup FROM topup_history WHERE status = 'completed' AND shop_id = ?",
            [shopId]
        );
        const totalTopup = topupResult[0].total_topup || 0;

        // 2. Total Users
        const [userResult] = await pool.query<RowDataPacket[]>(
            "SELECT COUNT(*) as total_users FROM users WHERE shop_id = ?",
            [shopId]
        );
        const totalUsers = userResult[0].total_users || 0;

        // 3. Total Sales
        const [salesResult] = await pool.query<RowDataPacket[]>(
            "SELECT SUM(price * quantity) as total_sales FROM orders WHERE status = 'completed' AND shop_id = ?",
            [shopId]
        );
        const totalSales = salesResult[0].total_sales || 0;

        return NextResponse.json({
            totalTopup,
            totalUsers,
            totalSales
        });

    } catch (error: any) {
        console.error("Fetch Stats Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
