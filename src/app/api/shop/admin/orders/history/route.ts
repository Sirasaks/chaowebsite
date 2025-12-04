import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";

import { getShopIdFromRequest } from "@/lib/shop-helper";

export async function GET(request: Request) {
    try {
        const shopId = await getShopIdFromRequest(request);
        if (!shopId) {
            return NextResponse.json({ error: "Shop not found" }, { status: 404 });
        }

        // Auth Check
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
            const decoded = jwt.verify(token, getJwtSecret()) as { role?: string };
            if (decoded.role !== 'owner') {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        } catch (err) {
            return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";

        const connection = await pool.getConnection();

        try {
            let query = `
                SELECT 
                    o.id,
                    o.user_id,
                    u.username,
                    p.name as product_name,
                    p.price,
                    o.quantity,
                    o.data,
                    o.status,
                    o.note,
                    o.created_at
                FROM orders o
                JOIN users u ON o.user_id = u.id
                JOIN products p ON o.product_id = p.id
                WHERE o.shop_id = ?
            `;

            const queryParams: any[] = [shopId];

            if (search) {
                query += ` AND (u.username LIKE ? OR o.id LIKE ? OR p.name LIKE ?)`;
                queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }

            query += ` ORDER BY o.created_at DESC LIMIT 100`; // Limit to 100 for now to avoid overload

            const [orders] = await connection.query<RowDataPacket[]>(query, queryParams);

            return NextResponse.json(orders);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Error fetching admin order history:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
