import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";
import { getJwtSecret } from "@/lib/env";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decoded = jwt.verify(token, getJwtSecret()) as { userId: number; role?: string; tokenType?: string };

        // Verify this is a master token
        if (decoded.tokenType && decoded.tokenType !== 'master') {
            return NextResponse.json({ error: "Invalid token scope" }, { status: 401 });
        }

        // Fetch shops owned by this master user
        // We fetch the order data associated with the shop creation from master_orders
        // Fallback to searching 'orders' table for backward compatibility if needed (but prioritizing master_orders)
        const [rows] = await pool.query(
            `SELECT s.id, s.name, s.subdomain, s.expire_date, s.created_at,
            COALESCE(
                (SELECT data FROM master_orders WHERE shop_id = s.id AND data LIKE '%"username":%' ORDER BY id ASC LIMIT 1),
                (SELECT data FROM orders WHERE shop_id = s.id AND data LIKE '%"username":%' ORDER BY id ASC LIMIT 1)
            ) as order_data 
            FROM shops s 
            WHERE s.owner_id = ? 
            ORDER BY s.created_at DESC`,
            [decoded.userId]
        );

        return NextResponse.json({ shops: rows });
    } catch (err) {
        console.error("Error fetching history:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
