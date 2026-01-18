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

        // ✅ Optimized Query: Use LEFT JOIN instead of correlated subqueries
        // This is O(1) per shop instead of O(n) subqueries
        const [rows] = await pool.query(
            `SELECT 
                s.id, 
                s.name, 
                s.subdomain, 
                s.expire_date, 
                s.created_at,
                COALESCE(mo.data, o.data) as order_data
            FROM shops s
            LEFT JOIN (
                SELECT shop_id, data,
                       ROW_NUMBER() OVER (PARTITION BY shop_id ORDER BY id ASC) as rn
                FROM master_orders 
                WHERE data LIKE '%"username":%'
            ) mo ON mo.shop_id = s.id AND mo.rn = 1
            LEFT JOIN (
                SELECT shop_id, data,
                       ROW_NUMBER() OVER (PARTITION BY shop_id ORDER BY id ASC) as rn  
                FROM orders
                WHERE data LIKE '%"username":%'
            ) o ON o.shop_id = s.id AND o.rn = 1 AND mo.data IS NULL
            WHERE s.owner_id = ?
            ORDER BY s.created_at DESC`,
            [decoded.userId]
        );

        // ✅ Add caching headers for better performance
        return NextResponse.json(
            { shops: rows },
            {
                headers: {
                    'Cache-Control': 'no-store, max-age=0'
                }
            }
        );
    } catch (err) {
        console.error("Error fetching history:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

