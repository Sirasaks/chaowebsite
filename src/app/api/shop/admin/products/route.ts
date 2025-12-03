import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";

export const dynamic = 'force-dynamic';

// Helper to generate slug
function generateSlug(name: string) {
    return name
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");
}

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

export async function GET(request: Request) {
    if (!await checkAdmin()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    try {
        let query = `
            SELECT p.*, 
            (SELECT COALESCE(SUM(quantity), 0) FROM orders WHERE product_id = p.id AND status = 'completed') as sold
            FROM products p
        `;
        const params: any[] = [];

        if (type) {
            query += " WHERE type = ?";
            params.push(type);
        }

        query += " ORDER BY display_order ASC, created_at DESC";

        const [rows] = await pool.query<RowDataPacket[]>(query, params);
        return NextResponse.json({ products: rows });
    } catch (error) {
        console.error("Fetch Products Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    if (!await checkAdmin()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connection = await pool.getConnection();
    try {
        const body = await request.json();
        const { name, price, image, description, type, account, is_recommended, display_order, is_active } = body;

        if (!name || !price || !type) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const slug = generateSlug(name) + "-" + Date.now();

        const [result] = await connection.query<ResultSetHeader>(
            `INSERT INTO products (name, slug, price, image, description, type, account, is_recommended, display_order, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                slug,
                price,
                image || "",
                description || "",
                type,
                account || "",
                is_recommended || false,
                display_order || 0,
                is_active !== undefined ? is_active : 1  // Default to active
            ]
        );

        return NextResponse.json({ success: true, id: result.insertId });
    } catch (error) {
        console.error("Create Product Error:", error);
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
        const { id, name, price, image, description, account, is_recommended, display_order, is_active } = body;

        if (!id) {
            return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
        }

        // Build update query dynamically
        let updates: string[] = [];
        const params: any[] = [];

        if (name !== undefined) { updates.push("name = ?"); params.push(name); }
        if (price !== undefined) { updates.push("price = ?"); params.push(price); }
        if (image !== undefined) { updates.push("image = ?"); params.push(image); }
        if (description !== undefined) { updates.push("description = ?"); params.push(description); }
        if (account !== undefined) { updates.push("account = ?"); params.push(account); }
        if (is_recommended !== undefined) { updates.push("is_recommended = ?"); params.push(is_recommended); }
        if (display_order !== undefined) { updates.push("display_order = ?"); params.push(display_order); }
        if (is_active !== undefined) { updates.push("is_active = ?"); params.push(is_active); }

        if (updates.length === 0) {
            return NextResponse.json({ error: "No fields to update" }, { status: 400 });
        }

        const query = `UPDATE products SET ${updates.join(", ")} WHERE id = ?`;
        params.push(id);

        await connection.query(query, params);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update Product Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        connection.release();
    }
}

export async function DELETE(request: Request) {
    if (!await checkAdmin()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
        await connection.query("DELETE FROM products WHERE id = ?", [id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete Product Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    } finally {
        connection.release();
    }
}
