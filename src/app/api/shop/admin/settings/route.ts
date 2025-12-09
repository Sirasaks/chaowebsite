import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { invalidateSettingsCache } from "@/lib/settings-cache";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { getJwtSecret } from "@/lib/env";
import { getShopIdFromRequest } from "@/lib/shop-helper";

export async function PUT(req: Request) {
    // Get shopId first for security validation
    const shopId = await getShopIdFromRequest(req);
    if (!shopId) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    // CRITICAL SECURITY FIX: Add authentication check with shop scope
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const decoded = jwt.verify(token, getJwtSecret()) as { userId: number };
        const [users] = await pool.query<RowDataPacket[]>(
            "SELECT role FROM users WHERE id = ? AND shop_id = ?",
            [decoded.userId, shopId]
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

        // Check if settings exist for this shop
        const [existing] = await connection.query<RowDataPacket[]>(
            "SELECT id FROM site_settings WHERE shop_id = ?",
            [shopId]
        );

        if (existing.length > 0) {
            // Update
            await connection.query(
                `UPDATE site_settings SET 
                 site_title = ?, site_description = ?, site_icon = ?, site_logo = ?, 
                 site_background = ?, primary_color = ?, secondary_color = ?, contact_link = ?
                 WHERE shop_id = ?`,
                [site_title, site_description, site_icon, site_logo, site_background, primary_color, secondary_color, contact_link, shopId]
            );
        } else {
            // Insert
            await connection.query(
                `INSERT INTO site_settings (shop_id, site_title, site_description, site_icon, site_logo, site_background, primary_color, secondary_color, contact_link)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [shopId, site_title, site_description, site_icon, site_logo, site_background, primary_color, secondary_color, contact_link]
            );
        }

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
