import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { RowDataPacket } from "mysql2";
import { getJwtSecret } from "@/lib/env";
import { getShopIdFromRequest } from "@/lib/shop-helper";

// Helper function to mask sensitive API keys
function maskApiKey(key: string | null | undefined): string {
    if (!key || key.length <= 6) return "***";
    return key.substring(0, 3) + "***" + key.substring(key.length - 3);
}

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
        const [users] = await pool.query<RowDataPacket[]>("SELECT role FROM users WHERE id = ?", [decoded.userId]);

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
            "SELECT setting_key, setting_value FROM settings WHERE shop_id = ?",
            [shopId]
        );

        const settings: Record<string, string> = {};
        rows.forEach((row) => {
            // SECURITY FIX: Mask sensitive API keys
            if (row.setting_key.includes('api_key') || row.setting_key.includes('_key')) {
                settings[row.setting_key] = maskApiKey(row.setting_value);
            } else {
                settings[row.setting_key] = row.setting_value;
            }
        });

        return NextResponse.json(settings);

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
        const [users] = await pool.query<RowDataPacket[]>("SELECT role FROM users WHERE id = ?", [decoded.userId]);

        if (users.length === 0 || users[0].role !== "owner") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { gafiw_api_key, slipok_api_key, slipok_branch_id } = body;

        await connection.beginTransaction();

        // Upsert settings
        const settingsToUpdate = [
            { key: "gafiw_api_key", value: gafiw_api_key },
            { key: "slipok_api_key", value: slipok_api_key },
            { key: "slipok_branch_id", value: slipok_branch_id },
        ];

        for (const setting of settingsToUpdate) {
            if (setting.value !== undefined) {
                await connection.query(
                    "INSERT INTO settings (shop_id, setting_key, setting_value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = ?",
                    [shopId, setting.key, setting.value, setting.value]
                );
            }
        }

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
