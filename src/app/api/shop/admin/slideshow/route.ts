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

// Add new image
export async function POST(req: Request) {
    const shopId = await getShopIdFromRequest(req);
    if (!shopId) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    if (!await checkAdmin(shopId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connection = await pool.getConnection();
    try {
        const body = await req.json();
        const { image_url } = body;

        if (!image_url) {
            return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
        }

        // Get max order for this shop
        const [rows] = await connection.query<any[]>("SELECT MAX(display_order) as maxOrder FROM slideshow_images WHERE shop_id = ?", [shopId]);
        const nextOrder = (rows[0]?.maxOrder || 0) + 1;

        await connection.query(
            "INSERT INTO slideshow_images (shop_id, image_url, display_order) VALUES (?, ?, ?)",
            [shopId, image_url, nextOrder]
        );

        // Invalidate cache immediately
        revalidateTag('slideshow', { expire: 0 });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Add Slideshow Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        connection.release();
    }
}

// Update image (order or url)
export async function PUT(req: Request) {
    const shopId = await getShopIdFromRequest(req);
    if (!shopId) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    if (!await checkAdmin(shopId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connection = await pool.getConnection();
    try {
        const body = await req.json();
        const { id, image_url, display_order } = body;

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        if (image_url !== undefined) {
            await connection.query("UPDATE slideshow_images SET image_url = ? WHERE id = ? AND shop_id = ?", [image_url, id, shopId]);
        }

        if (display_order !== undefined) {
            await connection.query("UPDATE slideshow_images SET display_order = ? WHERE id = ? AND shop_id = ?", [display_order, id, shopId]);
        }

        // Invalidate cache immediately
        revalidateTag('slideshow', { expire: 0 });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update Slideshow Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        connection.release();
    }
}

// Delete image
export async function DELETE(req: Request) {
    const shopId = await getShopIdFromRequest(req);
    if (!shopId) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    if (!await checkAdmin(shopId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connection = await pool.getConnection();
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        const [result] = await connection.query<ResultSetHeader>("DELETE FROM slideshow_images WHERE id = ? AND shop_id = ?", [id, shopId]);

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: "Image not found or not authorized" }, { status: 404 });
        }

        // Invalidate cache immediately
        revalidateTag('slideshow', { expire: 0 });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Slideshow Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        connection.release();
    }
}
