import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";

export async function GET() {
    try {
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

        const connection = await pool.getConnection();

        try {
            // Fetch pending orders where product type is 'form' (manual fulfillment)
            // We join with users and products to get details
            const [orders] = await connection.query<RowDataPacket[]>(
                `SELECT 
                    o.id,
                    o.user_id,
                    u.username,
                    p.name as product_name,
                    p.price,
                    o.quantity,
                    o.data,
                    o.created_at
                FROM orders o
                JOIN users u ON o.user_id = u.id
                JOIN products p ON o.product_id = p.id
                WHERE o.status = 'pending' 
                AND p.type = 'form'
                ORDER BY o.created_at ASC`
            );

            return NextResponse.json(orders);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Error fetching manual orders:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
