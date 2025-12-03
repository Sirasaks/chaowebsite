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
