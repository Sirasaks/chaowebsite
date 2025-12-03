import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export const dynamic = 'force-dynamic';

export async function GET() {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query<RowDataPacket[]>(
            "SELECT site_title, site_description, site_icon, site_logo, site_background, primary_color, secondary_color, contact_link FROM site_settings WHERE id = 1"
        );

        if (rows.length === 0) {
            // Should not happen if migration ran, but fallback
            return NextResponse.json({
                site_title: 'My Shop V4',
                site_icon: '',
                site_logo: '',
                primary_color: '#ea580c',
                secondary_color: '#8b5cf6'
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
