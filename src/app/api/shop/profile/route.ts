import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { RowDataPacket } from "mysql2";
import { getJwtSecret } from "@/lib/env";
import { getShopIdFromRequest } from "@/lib/shop-helper";

export async function GET(req: Request) {
    try {
        const shopId = await getShopIdFromRequest(req);
        if (!shopId) {
            return NextResponse.json({ error: "Shop not found" }, { status: 404 });
        }

        // 1. Authenticate User
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let userId: number;
        try {
            const decoded = jwt.verify(token, getJwtSecret()) as { userId: number };
            userId = decoded.userId;
        } catch (err) {
            return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
        }

        const connection = await pool.getConnection();

        try {
            // 2. Fetch User Info (Verify user belongs to shop)
            const [users] = await connection.query<RowDataPacket[]>(
                "SELECT id, username, email, role, credit, created_at FROM users WHERE id = ? AND shop_id = ?",
                [userId, shopId]
            );

            if (users.length === 0) {
                return NextResponse.json({ error: "User not found in this shop" }, { status: 404 });
            }

            const user = users[0];

            // 3. Fetch Stats
            // Total Orders & Spent
            const [orderStats] = await connection.query<RowDataPacket[]>(
                "SELECT COUNT(*) as total_orders, SUM(price * quantity) as total_spent FROM orders WHERE user_id = ? AND shop_id = ?",
                [userId, shopId]
            );

            // Total Top-up
            const [topupStats] = await connection.query<RowDataPacket[]>(
                "SELECT COUNT(*) as total_topups, SUM(amount) as total_topup_amount FROM topup_history WHERE user_id = ? AND shop_id = ? AND status = 'completed'",
                [userId, shopId]
            );

            // 4. Fetch Recent Activity
            // Recent Orders
            const [recentOrders] = await connection.query<RowDataPacket[]>(
                `SELECT o.id, p.name as product_name, o.price, o.quantity, o.status, o.created_at 
                 FROM orders o 
                 JOIN products p ON o.product_id = p.id 
                 WHERE o.user_id = ? AND o.shop_id = ?
                 ORDER BY o.created_at DESC LIMIT 5`,
                [userId, shopId]
            );

            // Recent Top-ups
            const [recentTopups] = await connection.query<RowDataPacket[]>(
                "SELECT id, trans_ref, amount, status, created_at FROM topup_history WHERE user_id = ? AND shop_id = ? ORDER BY created_at DESC LIMIT 5",
                [userId, shopId]
            );

            return NextResponse.json({
                user,
                stats: {
                    totalOrders: orderStats[0].total_orders || 0,
                    totalSpent: orderStats[0].total_spent || 0,
                    totalTopups: topupStats[0].total_topups || 0,
                    totalTopupAmount: topupStats[0].total_topup_amount || 0,
                },
                recentOrders,
                recentTopups
            });

        } finally {
            connection.release();
        }

    } catch (error: any) {
        console.error("Profile Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
