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

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const offset = (page - 1) * limit;

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
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        // Verify user belongs to shop
        const [users] = await pool.query<RowDataPacket[]>(
            "SELECT id FROM users WHERE id = ? AND shop_id = ?",
            [userId, shopId]
        );
        if (users.length === 0) {
            return NextResponse.json({ error: "User not found in this shop" }, { status: 404 });
        }

        let countQuery = "SELECT COUNT(*) as total FROM orders o JOIN products p ON o.product_id = p.id WHERE o.user_id = ? AND o.shop_id = ?";
        let dataQuery = `SELECT o.*, p.name as product_name, p.type as product_type, p.image as product_image
       FROM orders o
       JOIN products p ON o.product_id = p.id
       WHERE o.user_id = ? AND o.shop_id = ?`;

        const queryParams: any[] = [userId, shopId];

        if (search) {
            const searchCondition = " AND p.name LIKE ?";
            countQuery += searchCondition;
            dataQuery += searchCondition;
            queryParams.push(`%${search}%`);
        }

        dataQuery += " ORDER BY o.created_at DESC LIMIT ? OFFSET ?";

        // Get total count
        const [countRows] = await pool.query<RowDataPacket[]>(countQuery, queryParams);
        const total = countRows[0].total;
        const totalPages = Math.ceil(total / limit);

        // Get paginated orders
        const [orders] = await pool.query<RowDataPacket[]>(dataQuery, [...queryParams, limit, offset]);

        return NextResponse.json({
            orders,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        });
    } catch (error) {
        console.error("History Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
