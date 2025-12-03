import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

export const revalidate = 60; // Revalidate every 60 seconds

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        o.id,
        o.created_at,
        p.name as product_name,
        p.image as product_image,
        u.username
      FROM orders o
      JOIN products p ON o.product_id = p.id
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 20
    `);

        const recentOrders = rows.map((order) => {
            // Mask username: "Somchai" -> "Som***"
            const username = order.username;
            const maskedUsername = username.length > 3
                ? username.substring(0, 3) + "***"
                : username + "***";

            return {
                id: order.id,
                product_name: order.product_name,
                product_image: order.product_image,
                username: maskedUsername,
                time_ago: formatDistanceToNow(new Date(order.created_at), { addSuffix: true, locale: th }),
            };
        });

        return NextResponse.json(recentOrders);
    } catch (error) {
        console.error("Error fetching recent orders:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
