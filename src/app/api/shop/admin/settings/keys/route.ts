import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { RowDataPacket } from "mysql2";
import { getJwtSecret } from "@/lib/env";
import { getShopIdFromRequest } from "@/lib/shop-helper";
import { encrypt } from "@/lib/crypto";

export async function GET(request: Request) {
    try {
        const shopId = await getShopIdFromRequest(request);
        if (!shopId) {
            return NextResponse.json({ error: "Shop not found" }, { status: 404 });
        }

        // Authenticate Admin
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decoded = jwt.verify(token, getJwtSecret()) as { userId: number };
        const [users] = await pool.query<RowDataPacket[]>("SELECT role FROM users WHERE id = ? AND shop_id = ?", [decoded.userId, shopId]);

        if (users.length === 0 || users[0].role !== "owner") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Ensure table exists (Updated schema to support shop_id)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS settings (
                shop_id INT NOT NULL,
                setting_key VARCHAR(255) NOT NULL,
                setting_value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (shop_id, setting_key)
            )
        `);

        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT setting_key, setting_value FROM settings WHERE shop_id = ? AND setting_key = 'easyslip_access_token'",
            [shopId]
        );

        // Return only a flag indicating if token exists, never the actual value
        const hasEasyslipToken = rows.length > 0 && rows[0].setting_value && rows[0].setting_value.length > 0;

        return NextResponse.json({ hasEasyslipToken });

    } catch (error: any) {
        console.error("Fetch Settings Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

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
        const [users] = await pool.query<RowDataPacket[]>("SELECT role FROM users WHERE id = ? AND shop_id = ?", [decoded.userId, shopId]);

        if (users.length === 0 || users[0].role !== "owner") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { easyslip_access_token } = body;

        // Only save if a new token is provided (not empty)
        if (!easyslip_access_token || easyslip_access_token.trim() === '') {
            return NextResponse.json({ message: "ไม่มีการเปลี่ยนแปลง Token" });
        }

        await connection.beginTransaction();

        // Encrypt the token before storing
        const encryptedToken = encrypt(easyslip_access_token);

        await connection.query(
            "INSERT INTO settings (shop_id, setting_key, setting_value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = ?",
            [shopId, "easyslip_access_token", encryptedToken, encryptedToken]
        );

        await connection.commit();

        return NextResponse.json({ message: "บันทึกการตั้งค่าเรียบร้อยแล้ว" });

    } catch (error: any) {
        await connection.rollback();
        console.error("Update Settings Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        connection.release();
    }
}
