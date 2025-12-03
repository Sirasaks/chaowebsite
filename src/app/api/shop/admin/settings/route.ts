import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { invalidateSettingsCache } from "@/lib/settings-cache";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { RowDataPacket } from "mysql2";
import { getJwtSecret } from "@/lib/env";

export async function PUT(req: Request) {
    // CRITICAL SECURITY FIX: Add authentication check
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const decoded = jwt.verify(token, getJwtSecret()) as { userId: number };
        const [users] = await pool.query<RowDataPacket[]>(
            "SELECT role FROM users WHERE id = ?",
            [decoded.userId]
        );

        if (users.length === 0 || users[0].role !== 'owner') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
    } catch (err) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const connection = await pool.getConnection();
    try {
        const body = await req.json();
        const { site_title, site_description, site_icon, site_logo, site_background, primary_color, secondary_color, contact_link } = body;

        await connection.query(
            `INSERT INTO site_settings (id, site_title, site_description, site_icon, site_logo, site_background, primary_color, secondary_color, contact_link)
             VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             site_title = VALUES(site_title),
             site_description = VALUES(site_description),
             site_icon = VALUES(site_icon),
             site_logo = VALUES(site_logo),
             site_background = VALUES(site_background),
             primary_color = VALUES(primary_color),
             secondary_color = VALUES(secondary_color),
             contact_link = VALUES(contact_link)`,
            [site_title, site_description, site_icon, site_logo, site_background, primary_color, secondary_color, contact_link]
        );

        // Invalidate in-memory cache
        invalidateSettingsCache();

        // Force Next.js to re-render the RootLayout to apply new CSS variables
        revalidatePath("/", "layout");

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update Settings Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        connection.release();
    }
}
