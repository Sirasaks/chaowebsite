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

        // Verify user belongs to shop
        const [users] = await pool.query<RowDataPacket[]>(
            "SELECT id FROM users WHERE id = ? AND shop_id = ?",
            [userId, shopId]
        );
        if (users.length === 0) {
            return NextResponse.json({ error: "User not found in this shop" }, { status: 404 });
        }

        // 2. Parse Query Params
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const offset = (page - 1) * limit;

        // 3. Build Query
        let query = "SELECT * FROM topup_history WHERE user_id = ? AND shop_id = ?";
        const queryParams: any[] = [userId, shopId];

        if (search) {
            query += " AND (trans_ref LIKE ? OR amount LIKE ?)";
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        // Count total for pagination
        const countQuery = `SELECT COUNT(*) as total FROM (${query}) as sub`;
        const [countRows] = await pool.query<RowDataPacket[]>(countQuery, queryParams);
        const totalItems = countRows[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        // Add Order and Limit
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
        queryParams.push(limit, offset);

        // 4. Fetch Data
        const [rows] = await pool.query<RowDataPacket[]>(query, queryParams);

        return NextResponse.json({
            data: rows,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages,
            }
        });

    } catch (error: any) {
        console.error("Error fetching topup history:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
