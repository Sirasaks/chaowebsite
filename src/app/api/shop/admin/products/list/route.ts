import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { mergeRealTimeStock } from "@/lib/product-service";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";
import { getShopIdFromRequest } from "@/lib/shop-helper";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
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

    const connection = await pool.getConnection();
    try {

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type");

        let query = `SELECT * FROM products WHERE shop_id = ?`;
        const params: any[] = [shopId];

        if (type) {
            query += " AND type = ?";
            params.push(type);
        }

        query += " ORDER BY created_at ASC";

        const [rows] = await connection.query<RowDataPacket[]>(query, params);

        // Always merge with real-time data
        // mergeRealTimeStock will respect is_auto_price:
        // - Auto mode (is_auto_price=true): uses API price
        // - Custom mode (is_auto_price=false): uses DB price
        const products = await mergeRealTimeStock(rows as any[]);

        return NextResponse.json({ products });

    } catch (error) {
        console.error("Admin Product List Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
