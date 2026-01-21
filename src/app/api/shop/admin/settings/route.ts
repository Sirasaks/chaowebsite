import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { invalidateSettingsCache } from "@/lib/settings-cache";
import { revalidatePath, revalidateTag } from "next/cache";
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
        const { site_title, site_description, site_icon, site_logo, site_background, primary_color, secondary_color, contact_link, announcement_text, site_font } = body;

        // Check if settings exist for this shop
        const [existing] = await connection.query<RowDataPacket[]>(
            "SELECT id FROM site_settings WHERE shop_id = ?",
            [shopId]
        );

        if (existing.length > 0) {
            // Update only provided fields
            const updates: string[] = [];
            const params: any[] = [];

            if (site_title !== undefined) { updates.push("site_title = ?"); params.push(site_title); }
            if (site_description !== undefined) { updates.push("site_description = ?"); params.push(site_description); }
            if (site_icon !== undefined) { updates.push("site_icon = ?"); params.push(site_icon); }
            if (site_logo !== undefined) { updates.push("site_logo = ?"); params.push(site_logo); }
            if (site_background !== undefined) { updates.push("site_background = ?"); params.push(site_background); }
            if (primary_color !== undefined) { updates.push("primary_color = ?"); params.push(primary_color); }
            if (secondary_color !== undefined) { updates.push("secondary_color = ?"); params.push(secondary_color); }
            if (contact_link !== undefined) { updates.push("contact_link = ?"); params.push(contact_link); }
            if (announcement_text !== undefined) { updates.push("announcement_text = ?"); params.push(announcement_text); }
            if (site_font !== undefined) { updates.push("site_font = ?"); params.push(site_font); }

            if (updates.length > 0) {
                params.push(shopId);
                await connection.query(
                    `UPDATE site_settings SET ${updates.join(", ")} WHERE shop_id = ?`,
                    params
                );
            }
        } else {
            // Fetch shop name for default title
            const [shops] = await connection.query<RowDataPacket[]>(
                "SELECT name FROM shops WHERE id = ?",
                [shopId]
            );
            const defaultTitle = shops[0]?.name || "My Shop";

            // Insert with provided values or defaults
            await connection.query(
                `INSERT INTO site_settings (shop_id, site_title, site_description, site_icon, site_logo, site_background, primary_color, secondary_color, contact_link, announcement_text)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    shopId,
                    site_title || defaultTitle,
                    site_description || "",
                    site_icon || "",
                    site_logo || "",
                    site_background || "",
                    primary_color || "#09090b", // Default primary (zinc-950)
                    secondary_color || "#ffffff", // Default secondary (white)
                    contact_link || null,
                    announcement_text || null
                ]
            );
        }

        // Invalidate in-memory cache
        invalidateSettingsCache();

        // Invalidate Next.js cache tags
        revalidateTag('settings', { expire: 0 });

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
