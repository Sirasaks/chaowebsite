import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
    try {
        const [rows] = await pool.query("SELECT * FROM quick_links ORDER BY display_order ASC");
        return NextResponse.json(rows);
    } catch (error) {
        console.error("Error fetching quick links:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, image_url, link_url, is_external, display_order } = body;

        const [result] = await pool.query(
            "INSERT INTO quick_links (title, image_url, link_url, is_external, display_order) VALUES (?, ?, ?, ?, ?)",
            [title, image_url, link_url, is_external, display_order || 0]
        );

        // @ts-ignore
        return NextResponse.json({ id: result.insertId, ...body });
    } catch (error) {
        console.error("Error creating quick link:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, title, image_url, link_url, is_external, display_order } = body;

        await pool.query(
            "UPDATE quick_links SET title = ?, image_url = ?, link_url = ?, is_external = ?, display_order = ? WHERE id = ?",
            [title, image_url, link_url, is_external, display_order, id]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating quick link:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        await pool.query("DELETE FROM quick_links WHERE id = ?", [id]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting quick link:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
