import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getShopIdFromRequest } from "@/lib/shop-helper";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const shopId = await getShopIdFromRequest(req);
    if (!shopId) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query<RowDataPacket[]>(
            "SELECT site_title, site_description, site_icon, site_logo, site_background, primary_color, secondary_color, contact_link, announcement_text FROM site_settings WHERE shop_id = ?",
            [shopId]
        );

        if (rows.length === 0) {
            // Return default settings if not found for this shop
            return NextResponse.json({
                site_title: 'My Shop',
                site_description: '',
                site_icon: '',
                site_logo: '',
                site_background: '',
                primary_color: '#ea580c',
                secondary_color: '#8b5cf6',
                contact_link: '',
                announcement_text: ''
            });
        }

        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error("Fetch Settings Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        connection.release();
    }
}
