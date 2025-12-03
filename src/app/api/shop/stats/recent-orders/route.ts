import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET() {
    try {
        const connection = await pool.getConnection();

        try {
            // Fetch last 10 orders with product info and masked username
            const [orders] = await connection.query<RowDataPacket[]>(
                `SELECT 
                    o.id,
                    CONCAT(SUBSTRING(u.username, 1, 1), '***') as masked_username,
                    p.name as product_name,
                    o.quantity,
                    o.created_at
                FROM orders o
                JOIN users u ON o.user_id = u.id
                JOIN products p ON o.product_id = p.id
                WHERE o.status = 'completed'
                ORDER BY o.created_at DESC
                LIMIT 10`
            );

            return NextResponse.json(orders);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Error fetching recent orders:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
