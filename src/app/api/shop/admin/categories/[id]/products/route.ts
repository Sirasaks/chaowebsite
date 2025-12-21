import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { Product } from "@/lib/product-service";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";
import { getShopIdFromRequest } from "@/lib/shop-helper";

export const dynamic = 'force-dynamic';

// Helper to check admin role with shop scope - SECURITY FIX
async function checkAdmin(shopId: number): Promise<boolean> {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return false;

    try {
        const decoded = jwt.verify(token, getJwtSecret()) as { userId: number };
        const [users] = await pool.query<RowDataPacket[]>(
            "SELECT role FROM users WHERE id = ? AND shop_id = ?",
            [decoded.userId, shopId]
        );
        return users.length > 0 && users[0].role === 'owner';
    } catch (error) {
        return false;
    }
}

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const shopId = await getShopIdFromRequest(request);
    if (!shopId) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    if (!await checkAdmin(shopId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const connection = await pool.getConnection();
    try {
        const resolvedParams = await context.params;
        const categoryId = parseInt(resolvedParams.id);

        if (isNaN(categoryId)) {
            return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
        }

        // Fetch only products that belong to this category
        const [products] = await connection.query<RowDataPacket[]>(
            `SELECT 
                p.id, p.name, p.image, p.price, p.account, p.type, p.display_order,
                (SELECT COALESCE(SUM(quantity), 0) FROM orders WHERE product_id = p.id AND status = 'completed' AND shop_id = p.shop_id) as sold
             FROM products p 
             WHERE p.shop_id = ? AND p.category_id = ? AND p.is_active = 1
             ORDER BY p.display_order ASC, p.created_at DESC`,
            [shopId, categoryId]
        );

        const formattedProducts = products.map((p: any) => {
            let stock = 0;
            if (p.type === 'account') {
                stock = p.account ? p.account.split('\n').filter((line: string) => line.trim() !== '').length : 0;
            }

            return {
                id: p.id,
                name: p.name,
                image: p.image,
                price: p.price,
                stock: stock,
                sold: p.sold,
                type: p.type,
                display_order: p.display_order || 0
            };
        });

        return NextResponse.json({ products: formattedProducts });

    } catch (error) {
        console.error("Fetch Category Products Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        connection.release();
    }
}

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const shopId = await getShopIdFromRequest(request);
    if (!shopId) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    if (!await checkAdmin(shopId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const connection = await pool.getConnection();
    try {
        const resolvedParams = await context.params;
        const categoryId = parseInt(resolvedParams.id);
        const body = await request.json();
        const { productOrders } = body; // Array of { id, display_order }

        if (isNaN(categoryId)) {
            return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
        }

        if (!Array.isArray(productOrders)) {
            return NextResponse.json({ error: "productOrders must be an array" }, { status: 400 });
        }

        // Update display_order for each product (ensure they belong to this shop and category)
        await connection.beginTransaction();

        for (const item of productOrders) {
            await connection.query(
                "UPDATE products SET display_order = ? WHERE id = ? AND shop_id = ? AND category_id = ?",
                [item.display_order, item.id, shopId, categoryId]
            );
        }

        await connection.commit();

        return NextResponse.json({ message: "Product order updated successfully" });

    } catch (error) {
        await connection.rollback();
        console.error("Update Category Products Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        connection.release();
    }
}
