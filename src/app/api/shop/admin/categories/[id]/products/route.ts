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

        // ดึงสินค้าทั้งหมด
        const [products] = await connection.query<RowDataPacket[]>(
            `SELECT 
                p.id, p.name, p.image, p.price, p.account, 0 as stock, p.type,
                (SELECT COALESCE(SUM(quantity), 0) FROM orders WHERE product_id = p.id AND status = 'completed' AND shop_id = p.shop_id) as sold
             FROM products p 
             WHERE p.shop_id = ?
             ORDER BY p.created_at DESC`,
            [shopId]
        );

        // Merge logic removed
        let productsWithRealTimeData = products;

        // ดึง product_ids จาก category
        const [categoryRows] = await connection.query<RowDataPacket[]>(
            "SELECT product_ids FROM categories WHERE id = ? AND shop_id = ?",
            [categoryId, shopId]
        );

        const selectedProductIds = categoryRows.length > 0 && categoryRows[0].product_ids
            ? JSON.parse(categoryRows[0].product_ids)
            : [];

        // Create a map for O(1) lookup of order
        const orderMap = new Map();
        if (Array.isArray(selectedProductIds)) {
            selectedProductIds.forEach((id: number, index: number) => {
                orderMap.set(id, index);
            });
        }

        const formattedProducts = productsWithRealTimeData.map((p: any) => {
            let stock = p.stock;
            if (p.type === 'account') {
                stock = p.account ? p.account.split('\n').filter((line: string) => line.trim() !== '').length : 0;
            }

            const isSelected = orderMap.has(p.id);

            return {
                id: p.id,
                name: p.name,
                image: p.image,
                price: p.price,
                stock: stock,
                sold: p.sold,
                type: p.type,
                isSelected: isSelected,
                display_order: isSelected ? orderMap.get(p.id) : 999999 // Selected items keep order, others go to end
            };
        });

        // Optional: Sort by display_order if you want the API to return sorted list
        // formattedProducts.sort((a, b) => a.display_order - b.display_order);

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
        const { productIds } = body;

        if (isNaN(categoryId)) {
            return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
        }

        if (!Array.isArray(productIds)) {
            return NextResponse.json({ error: "productIds must be an array" }, { status: 400 });
        }

        // บันทึก product_ids เป็น JSON
        await connection.query(
            "UPDATE categories SET product_ids = ? WHERE id = ? AND shop_id = ?",
            [JSON.stringify(productIds), categoryId, shopId]
        );

        return NextResponse.json({ message: "Category products updated successfully" });

    } catch (error) {
        console.error("Update Category Products Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        connection.release();
    }
}
