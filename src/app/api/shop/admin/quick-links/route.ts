import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";
import { getShopIdFromRequest } from "@/lib/shop-helper";
import { revalidateTag } from "next/cache";

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

export async function GET(req: Request) {
    const shopId = await getShopIdFromRequest(req);
    if (!shopId) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    try {
        const [rows] = await pool.query("SELECT * FROM quick_links WHERE shop_id = ? ORDER BY display_order ASC", [shopId]);
        return NextResponse.json(rows);
    } catch (error) {
        console.error("Error fetching quick links:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const shopId = await getShopIdFromRequest(req);
    if (!shopId) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    if (!await checkAdmin(shopId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { title, image_url, link_url, is_external, display_order } = body;

        const [result] = await pool.query<ResultSetHeader>(
            "INSERT INTO quick_links (shop_id, title, image_url, link_url, is_external, display_order) VALUES (?, ?, ?, ?, ?, ?)",
            [shopId, title, image_url, link_url, is_external, display_order || 0]
        );

        // Invalidate cache immediately
        revalidateTag('quick-links', { expire: 0 });

        // @ts-ignore
        return NextResponse.json({ id: result.insertId, ...body });
    } catch (error) {
        console.error("Error creating quick link:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const shopId = await getShopIdFromRequest(req);
    if (!shopId) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    if (!await checkAdmin(shopId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, title, image_url, link_url, is_external, display_order } = body;

        const [result] = await pool.query<ResultSetHeader>(
            "UPDATE quick_links SET title = ?, image_url = ?, link_url = ?, is_external = ?, display_order = ? WHERE id = ? AND shop_id = ?",
            [title, image_url, link_url, is_external, display_order, id, shopId]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: "Quick link not found or not authorized" }, { status: 404 });
        }

        // Invalidate cache immediately
        revalidateTag('quick-links', { expire: 0 });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating quick link:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const shopId = await getShopIdFromRequest(req);
    if (!shopId) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    if (!await checkAdmin(shopId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        const [result] = await pool.query<ResultSetHeader>("DELETE FROM quick_links WHERE id = ? AND shop_id = ?", [id, shopId]);

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: "Quick link not found or not authorized" }, { status: 404 });
        }

        // Invalidate cache immediately
        revalidateTag('quick-links', { expire: 0 });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting quick link:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
