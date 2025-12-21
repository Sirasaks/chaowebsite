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

        // Authenticate Admin
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decoded = jwt.verify(token, getJwtSecret()) as { userId: number };
        const [users] = await pool.query<RowDataPacket[]>(
            "SELECT role FROM users WHERE id = ? AND shop_id = ?",
            [decoded.userId, shopId]
        );

        if (users.length === 0 || users[0].role !== "owner") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Get shop subscription info
        const [shops] = await pool.query<RowDataPacket[]>(
            "SELECT name, subdomain, expire_date, created_at FROM shops WHERE id = ?",
            [shopId]
        );

        if (shops.length === 0) {
            return NextResponse.json({ error: "Shop not found" }, { status: 404 });
        }

        const shop = shops[0];

        return NextResponse.json({
            name: shop.name,
            subdomain: shop.subdomain,
            expireDate: shop.expire_date,
            createdAt: shop.created_at
        });

    } catch (error: any) {
        console.error("Fetch Subscription Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
