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
        const [users] = await pool.query<RowDataPacket[]>("SELECT role FROM users WHERE id = ? AND shop_id = ?", [decoded.userId, shopId]);

        if (users.length === 0 || users[0].role !== "owner") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Fetch Top-up History
        // Ensure table exists first (just in case)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS topup_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                trans_ref VARCHAR(255) NOT NULL UNIQUE,
                amount DECIMAL(10, 2) NOT NULL,
                sender_name VARCHAR(255),
                receiver_name VARCHAR(255),
                status VARCHAR(50) DEFAULT 'completed',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `);

        const [rows] = await pool.query(`
            SELECT 
                th.*,
                u.username
            FROM topup_history th
            JOIN users u ON th.user_id = u.id
            WHERE u.shop_id = ?
            ORDER BY th.created_at DESC
            LIMIT 100
        `, [shopId]);

        return NextResponse.json({ history: rows });
    } catch (error: any) {
        console.error("Fetch Topup History Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
