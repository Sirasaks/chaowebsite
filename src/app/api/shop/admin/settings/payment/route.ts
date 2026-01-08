import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { RowDataPacket } from "mysql2";
import { getJwtSecret } from "@/lib/env";
import { getShopIdFromRequest } from "@/lib/shop-helper";

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

        // Fetch settings
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT setting_key, setting_value FROM settings WHERE shop_id = ? AND setting_key IN ('bank_code', 'bank_account_number', 'bank_account_name', 'truemoney_phone', 'bank_transfer_enabled', 'truemoney_angpao_enabled', 'truemoney_fee_enabled')",
            [shopId]
        );

        const settings: Record<string, string> = {};
        rows.forEach((row) => {
            settings[row.setting_key] = row.setting_value;
        });

        return NextResponse.json(settings);

    } catch (error: any) {
        console.error("Fetch Payment Settings Error:", error);
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
        const { bank_code, bank_account_number, bank_account_name, truemoney_phone, bank_transfer_enabled, truemoney_angpao_enabled, truemoney_fee_enabled } = body;

        await connection.beginTransaction();

        // Upsert settings
        const settingsToUpdate = [
            { key: "bank_code", value: bank_code },
            { key: "bank_account_number", value: bank_account_number },
            { key: "bank_account_name", value: bank_account_name },
            { key: "truemoney_phone", value: truemoney_phone },
            { key: "bank_transfer_enabled", value: bank_transfer_enabled },
            { key: "truemoney_angpao_enabled", value: truemoney_angpao_enabled },
            { key: "truemoney_fee_enabled", value: truemoney_fee_enabled },
        ];

        for (const setting of settingsToUpdate) {
            // Only update if value is explicitly provided (not undefined)
            if (setting.value !== undefined && setting.value !== null) {
                const valueToSave = typeof setting.value === 'boolean' ? String(setting.value) : setting.value;
                await connection.query(
                    "INSERT INTO settings (shop_id, setting_key, setting_value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = ?",
                    [shopId, setting.key, valueToSave, valueToSave]
                );
            }
        }

        await connection.commit();

        return NextResponse.json({ message: "บันทึกการตั้งค่าการชำระเงินเรียบร้อยแล้ว" });

    } catch (error: any) {
        await connection.rollback();
        console.error("Update Payment Settings Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        connection.release();
    }
}
