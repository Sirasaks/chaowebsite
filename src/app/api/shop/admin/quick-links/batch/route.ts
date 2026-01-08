import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { RowDataPacket } from "mysql2";
import { getJwtSecret } from "@/lib/env";
import { getShopIdFromRequest } from "@/lib/shop-helper";

export async function POST(request: Request) {
    const shopId = await getShopIdFromRequest(request);
    if (!shopId) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const connection = await pool.getConnection();
    try {
        // Authenticate Admin
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decoded = jwt.verify(token, getJwtSecret()) as { userId: number };
        const [users] = await pool.query<RowDataPacket[]>(
            "SELECT role FROM users WHERE id = ? AND shop_id = ?",
            [decoded.userId, shopId]
        );

        if (users.length === 0 || users[0].role !== "owner") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { links } = await request.json();

        if (!Array.isArray(links) || links.length !== 4) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        await connection.beginTransaction();

        // Delete existing quick links for this shop
        await connection.query(
            "DELETE FROM quick_links WHERE shop_id = ?",
            [shopId]
        );

        // Insert new quick links (only if they have at least image_url or link_url)
        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            if (link.image_url || link.link_url) {
                await connection.query(
                    "INSERT INTO quick_links (shop_id, title, image_url, link_url, is_external, display_order) VALUES (?, ?, ?, ?, ?, ?)",
                    [shopId, `ปุ่มนำทาง ${i + 1}`, link.image_url || "", link.link_url || "", false, i + 1]
                );
            }
        }

        await connection.commit();

        return NextResponse.json({ message: "บันทึกข้อมูลสำเร็จ" });

    } catch (error: any) {
        await connection.rollback();
        console.error("Batch Quick Links Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        connection.release();
    }
}
