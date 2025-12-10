import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { getShopIdFromRequest } from "@/lib/shop-helper";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const shopId = await getShopIdFromRequest(request);
        if (!shopId) {
            return NextResponse.json({ error: "Shop not found" }, { status: 404 });
        }

        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT setting_key, setting_value FROM settings WHERE shop_id = ? AND setting_key IN ('bank_code', 'bank_account_number', 'bank_account_name', 'bank_transfer_enabled', 'truemoney_angpao_enabled')",
            [shopId]
        );

        const settings: Record<string, string> = {};
        rows.forEach((row) => {
            settings[row.setting_key] = row.setting_value;
        });

        return NextResponse.json(settings, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
            }
        });
    } catch (error: any) {
        console.error("Fetch Public Payment Settings Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
