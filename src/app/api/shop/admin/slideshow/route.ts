import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";

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

// Add new image
export async function POST(req: Request) {
    if (!await checkAdmin()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connection = await pool.getConnection();
    try {
        const body = await req.json();
        const { image_url } = body;

        if (!image_url) {
            return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
        }

        // Get max order
        const [rows] = await connection.query<any[]>("SELECT MAX(display_order) as maxOrder FROM slideshow_images");
        const nextOrder = (rows[0]?.maxOrder || 0) + 1;

        await connection.query(
            "INSERT INTO slideshow_images (image_url, display_order) VALUES (?, ?)",
            [image_url, nextOrder]
        );

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
    if (!await checkAdmin()) {
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
            await connection.query("UPDATE slideshow_images SET image_url = ? WHERE id = ?", [image_url, id]);
        }

        if (display_order !== undefined) {
            await connection.query("UPDATE slideshow_images SET display_order = ? WHERE id = ?", [display_order, id]);
        }

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
    if (!await checkAdmin()) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connection = await pool.getConnection();
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        await connection.query("DELETE FROM slideshow_images WHERE id = ?", [id]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete Slideshow Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        connection.release();
    }
}
