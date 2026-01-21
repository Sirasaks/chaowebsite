import { NextResponse } from "next/server";
import pool from "@/lib/db";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";
import { RowDataPacket } from "mysql2";
import { getShopIdFromRequest } from "@/lib/shop-helper";
import { revalidateTag } from "next/cache";

export const dynamic = 'force-dynamic';

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
        const { productId, is_active } = body;

        if (!productId) {
            return NextResponse.json(
                { error: "Product ID is required" },
                { status: 400 }
            );
        }

        // Update is_active status - SECURITY FIX: Added shop_id check
        await connection.query(
            "UPDATE products SET is_active = ? WHERE id = ? AND shop_id = ?",
            [is_active ? 1 : 0, productId, shopId]
        );

        // Invalidate cache immediately
        revalidateTag('products', { expire: 0 });
        revalidateTag('categories', { expire: 0 });

        return NextResponse.json({
            success: true,
            message: is_active ? "เปิดใช้งานสินค้าแล้ว" : "ปิดใช้งานสินค้าแล้ว"
        });

    } catch (error) {
        console.error("Toggle Active Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
