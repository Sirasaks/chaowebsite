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
            const decoded = jwt.verify(token, getJwtSecret()) as { userId: number };
            const [users] = await pool.query<RowDataPacket[]>(
                "SELECT role FROM users WHERE id = ? AND shop_id = ?",
                [decoded.userId, shopId]
            );
            if (users.length === 0 || users[0].role !== 'owner') {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        } catch (err) {
            return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const page = Number(searchParams.get("page")) || 1;
        const limit = Number(searchParams.get("limit")) || 10;
        const offset = (page - 1) * limit;

        const connection = await pool.getConnection();

        try {
            // Base WHERE clause
            let whereClause = "WHERE o.shop_id = ?";
            const queryParams: any[] = [shopId];

            if (search) {
                whereClause += ` AND (u.username LIKE ? OR o.id LIKE ? OR p.name LIKE ?)`;
                queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }

            // 1. Count Total
            const [countResult] = await connection.query<RowDataPacket[]>(
                `SELECT COUNT(*) as total 
                 FROM orders o
                 JOIN users u ON o.user_id = u.id
                 JOIN products p ON o.product_id = p.id
                 ${whereClause}`,
                queryParams
            );
            const totalItems = countResult[0].total;
            const totalPages = Math.ceil(totalItems / limit);

            // 2. Fetch Data
            let query = `
                SELECT 
                    o.id,
                    o.user_id,
                    o.product_id,
                    u.username,
                    p.name as product_name,
                    o.price,
                    o.quantity,
                    o.data,
                    o.status,
                    o.note,
                    o.created_at
                FROM orders o
                JOIN users u ON o.user_id = u.id
                JOIN products p ON o.product_id = p.id
                ${whereClause}
                ORDER BY o.created_at DESC
                LIMIT ? OFFSET ?
            `;

            // Add limit/offset to params
            const dataParams = [...queryParams, limit, offset];

            const [orders] = await connection.query<RowDataPacket[]>(query, dataParams);

            return NextResponse.json({
                data: orders,
                pagination: {
                    page,
                    limit,
                    totalPages,
                    totalItems
                }
            });
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
