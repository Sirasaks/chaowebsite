import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";
import { getShopIdFromRequest } from "@/lib/shop-helper";
import { revalidateTag } from "next/cache";
import { z } from "zod";

export const dynamic = 'force-dynamic';

// ✅ Zod Schemas for Input Validation
const createCategorySchema = z.object({
    name: z.string().min(1, "กรุณากรอกชื่อหมวดหมู่").max(100),
    image: z.string().url().optional().or(z.literal("")),
    slug: z.string().regex(/^[a-z0-9-]*$/, "URL ต้องเป็นตัวอักษรภาษาอังกฤษพิมพ์เล็ก ตัวเลข หรือ - เท่านั้น").optional(),
    is_recommended: z.boolean().optional(),
    display_order: z.number().int().min(0).optional(),
    is_active: z.boolean().optional(),
    no_agent_discount: z.boolean().optional(),
});

const updateCategorySchema = z.object({
    id: z.number().int().positive("ID ไม่ถูกต้อง"),
    name: z.string().min(1, "กรุณากรอกชื่อหมวดหมู่").max(100),
    image: z.string().url().optional().or(z.literal("")),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "URL ต้องเป็นตัวอักษรภาษาอังกฤษพิมพ์เล็ก ตัวเลข หรือ - เท่านั้น"),
    is_recommended: z.boolean().optional(),
    display_order: z.number().int().min(0).optional(),
    is_active: z.boolean().optional(),
    no_agent_discount: z.boolean().optional(),
});

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

export async function GET(request: Request) {
    const shopId = await getShopIdFromRequest(request);
    if (!shopId) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    if (!await checkAdmin(shopId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query<RowDataPacket[]>(
            "SELECT * FROM categories WHERE shop_id = ? ORDER BY display_order ASC, created_at DESC",
            [shopId]
        );
        return NextResponse.json({ categories: rows });
    } catch (error) {
        console.error("Get Categories Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        connection.release();
    }
}

export async function POST(request: Request) {
    const shopId = await getShopIdFromRequest(request);
    if (!shopId) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    if (!await checkAdmin(shopId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connection = await pool.getConnection();
    try {
        const body = await request.json();

        // ✅ Zod Validation
        const parseResult = createCategorySchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: parseResult.error.issues[0].message },
                { status: 400 }
            );
        }

        const { name, image, slug: providedSlug, is_recommended, display_order, is_active, no_agent_discount } = parseResult.data;

        const slug = providedSlug || (name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Math.floor(Math.random() * 1000));

        // Check for duplicate slug in this shop
        const [existing] = await connection.query<RowDataPacket[]>(
            "SELECT id FROM categories WHERE slug = ? AND shop_id = ?",
            [slug, shopId]
        );

        if (existing.length > 0) {
            return NextResponse.json({ error: "url นี้มีอยู่แล้ว" }, { status: 400 });
        }

        await connection.query<ResultSetHeader>(
            "INSERT INTO categories (shop_id, name, slug, image, is_recommended, display_order, is_active, no_agent_discount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [shopId, name, slug, image || "", is_recommended || false, display_order || 0, is_active !== undefined ? is_active : 1, no_agent_discount || false]
        );

        // Invalidate cache immediately
        revalidateTag('categories', { expire: 0 });
        revalidateTag('products', { expire: 0 });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Create Category Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        connection.release();
    }
}

export async function PUT(request: Request) {
    const shopId = await getShopIdFromRequest(request);
    if (!shopId) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    if (!await checkAdmin(shopId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connection = await pool.getConnection();
    try {
        const body = await request.json();

        // ✅ Zod Validation
        const parseResult = updateCategorySchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                { error: parseResult.error.issues[0].message },
                { status: 400 }
            );
        }

        const { id, name, image, slug, is_recommended, display_order, is_active, no_agent_discount } = parseResult.data;

        // Check for duplicate slug (excluding current category) in this shop
        const [existing] = await connection.query<RowDataPacket[]>(
            "SELECT id FROM categories WHERE slug = ? AND id != ? AND shop_id = ?",
            [slug, id, shopId]
        );

        if (existing.length > 0) {
            return NextResponse.json({ error: "url นี้มีอยู่แล้ว" }, { status: 400 });
        }

        const [result] = await connection.query<ResultSetHeader>(
            "UPDATE categories SET name = ?, image = ?, slug = ?, is_recommended = ?, display_order = ?, is_active = ?, no_agent_discount = ? WHERE id = ? AND shop_id = ?",
            [name, image || "", slug, is_recommended || false, display_order || 0, is_active !== undefined ? is_active : 1, no_agent_discount || false, id, shopId]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: "Category not found or not authorized" }, { status: 404 });
        }

        // Invalidate cache immediately
        revalidateTag('categories', { expire: 0 });
        revalidateTag('products', { expire: 0 });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update Category Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        connection.release();
    }
}

export async function DELETE(request: Request) {
    const shopId = await getShopIdFromRequest(request);
    if (!shopId) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    if (!await checkAdmin(shopId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connection = await pool.getConnection();
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        // Check if category has products in this shop
        // Note: Products are already filtered by shop_id, but good to be explicit
        const [products] = await connection.query<RowDataPacket[]>(
            "SELECT id FROM products WHERE category_id = ? AND shop_id = ? LIMIT 1",
            [id, shopId]
        );

        if (products.length > 0) {
            return NextResponse.json({ error: "Cannot delete category with products" }, { status: 400 });
        }

        const [result] = await connection.query<ResultSetHeader>("DELETE FROM categories WHERE id = ? AND shop_id = ?", [id, shopId]);

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: "Category not found or not authorized" }, { status: 404 });
        }

        // Invalidate cache immediately
        revalidateTag('categories', { expire: 0 });
        revalidateTag('products', { expire: 0 });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Category Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        connection.release();
    }
}
