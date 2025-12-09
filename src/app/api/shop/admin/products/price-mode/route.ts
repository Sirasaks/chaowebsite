import { NextResponse } from "next/server";
import pool from "@/lib/db";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";
import { RowDataPacket } from "mysql2";
import { getShopIdFromRequest } from "@/lib/shop-helper";

export async function POST(request: Request) {
    // Shop ID Validation - SECURITY FIX
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

        const body = await request.json();
        const { productId, isAutoPrice, price } = body;

        if (!productId) {
            return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
        }

        // Update query - SECURITY FIX: Added shop_id check
        // If isAutoPrice is true, we just update the flag.
        // If isAutoPrice is false, we update the flag AND the custom price.

        let query = "UPDATE products SET is_auto_price = ?";
        const params: any[] = [isAutoPrice];

        if (price !== undefined) {
            query += ", price = ?";
            params.push(price);
        }

        query += " WHERE id = ? AND shop_id = ?";
        params.push(productId);
        params.push(shopId);

        await connection.query(query, params);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Update Price Mode Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
