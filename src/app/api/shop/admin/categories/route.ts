import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";

export const dynamic = 'force-dynamic';

// Helper to check admin role
async function checkAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return false;

    try {
        const decoded = jwt.verify(token, getJwtSecret()) as { userId: number };
        const [users] = await pool.query<RowDataPacket[]>(
            "SELECT role FROM users WHERE id = ?",
            [decoded.userId]
        );
        return users.length > 0 && users[0].role === 'owner';
    } catch (error) {
        return false;
    }
}

export async function GET() {
    if (!await checkAdmin()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query<RowDataPacket[]>(
            "SELECT * FROM categories ORDER BY display_order ASC, created_at DESC"
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
    if (!await checkAdmin()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connection = await pool.getConnection();
    try {
        const body = await request.json();
        const { name, image, slug: providedSlug, is_recommended, display_order, is_active } = body;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const slug = providedSlug || (name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-' + Math.floor(Math.random() * 1000));

        // Check for duplicate slug
        const [existing] = await connection.query<RowDataPacket[]>(
            "SELECT id FROM categories WHERE slug = ?",
            [slug]
        );

        if (existing.length > 0) {
            return NextResponse.json({ error: "url นี้มีอยู่แล้ว" }, { status: 400 });
        }

        await connection.query<ResultSetHeader>(
            "INSERT INTO categories (name, slug, image, is_recommended, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?)",
            [name, slug, image || "", is_recommended || false, display_order || 0, is_active !== undefined ? is_active : 1]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Create Category Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        connection.release();
    }
}

export async function PUT(request: Request) {
    if (!await checkAdmin()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connection = await pool.getConnection();
    try {
        const body = await request.json();
        const { id, name, image, slug, is_recommended, display_order, is_active } = body;

        if (!id || !name || !slug) {
            return NextResponse.json({ error: "ID, Name and Slug are required" }, { status: 400 });
        }

        // Check for duplicate slug (excluding current category)
        const [existing] = await connection.query<RowDataPacket[]>(
            "SELECT id FROM categories WHERE slug = ? AND id != ?",
            [slug, id]
        );

        if (existing.length > 0) {
            return NextResponse.json({ error: "url นี้มีอยู่แล้ว" }, { status: 400 });
        }

        await connection.query(
            "UPDATE categories SET name = ?, image = ?, slug = ?, is_recommended = ?, display_order = ?, is_active = ? WHERE id = ?",
            [name, image || "", slug, is_recommended || false, display_order || 0, is_active !== undefined ? is_active : 1, id]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update Category Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        connection.release();
    }
}

export async function DELETE(request: Request) {
    if (!await checkAdmin()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connection = await pool.getConnection();
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        // Check if category has products
        const [products] = await connection.query<RowDataPacket[]>(
            "SELECT id FROM products WHERE category_id = ? LIMIT 1",
            [id]
        );

        if (products.length > 0) {
            return NextResponse.json({ error: "Cannot delete category with products" }, { status: 400 });
        }

        await connection.query("DELETE FROM categories WHERE id = ?", [id]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Category Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        connection.release();
    }
}
