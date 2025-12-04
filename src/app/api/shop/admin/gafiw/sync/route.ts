import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getGafiwProducts } from "@/lib/gafiw-service";
import { RowDataPacket } from "mysql2";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";
import { getShopIdFromRequest } from "@/lib/shop-helper";

export async function POST(request: Request) {
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
            "SELECT role FROM users WHERE id = ?",
            [decoded.userId]
        );
        if (users.length === 0 || users[0].role !== 'owner') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
    } catch (err) {
        return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
    }

    const connection = await pool.getConnection();
    try {

        const gafiwProducts = await getGafiwProducts();

        if (!gafiwProducts || gafiwProducts.length === 0) {
            return NextResponse.json({ message: "No products found from Gafiw API" });
        }

        let syncedCount = 0;

        for (const gp of gafiwProducts) {
            // Check if product exists by api_type_id AND shop_id
            const [existing] = await connection.query<RowDataPacket[]>(
                "SELECT id, is_auto_price FROM products WHERE api_type_id = ? AND shop_id = ?",
                [gp.type_id, shopId]
            );

            if (existing.length > 0) {
                // Product already exists - update price and set to auto mode
                const product = existing[0];
                await connection.query(
                    "UPDATE products SET type = 'api', api_provider = 'gafiw', price = ?, is_auto_price = true WHERE id = ? AND shop_id = ?",
                    [gp.price, product.id, shopId]
                );
            } else {
                // Insert new product
                const slug = gp.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Math.floor(Math.random() * 1000);

                // Insert with API price and auto mode
                await connection.query(
                    "INSERT INTO products (shop_id, name, slug, image, description, price, type, api_type_id, api_provider, is_auto_price) VALUES (?, ?, ?, ?, ?, ?, 'api', ?, 'gafiw', true)",
                    [shopId, gp.name, slug, gp.imageapi, gp.details, gp.price, gp.type_id]
                );
                syncedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Synced ${syncedCount} new products. Updated others.`
        });

    } catch (error) {
        console.error("Sync Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
