import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";
import { getShopIdFromRequest } from "@/lib/shop-helper";

// Helper to check admin role with shop scope
async function checkAdmin(shopId: number): Promise<boolean> {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return false;

    try {
        const decoded = jwt.verify(token, getJwtSecret()) as { userId: number };
        const [users] = await pool.query<RowDataPacket[]>(
            "SELECT role FROM users WHERE id = ? AND shop_id = ?",
            [decoded.userId, shopId]
        );
        return users.length > 0 && users[0].role === 'owner';
    } catch (error) {
        return false;
    }
}

// GET: Get agent discount setting
export async function GET(request: Request) {
    const shopId = await getShopIdFromRequest(request);
    if (!shopId) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    if (!await checkAdmin(shopId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const [settings] = await pool.query<RowDataPacket[]>(
            "SELECT setting_value FROM settings WHERE shop_id = ? AND setting_key = 'agent_discount_percent'",
            [shopId]
        );

        return NextResponse.json({
            agent_discount_percent: settings.length > 0 ? parseFloat(settings[0].setting_value) : 0
        });
    } catch (error) {
        console.error("Get Agent Settings Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PUT: Update agent discount setting
export async function PUT(request: Request) {
    const shopId = await getShopIdFromRequest(request);
    if (!shopId) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    if (!await checkAdmin(shopId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { agent_discount_percent } = await request.json();

        if (typeof agent_discount_percent !== 'number' || agent_discount_percent < 0 || agent_discount_percent > 100) {
            return NextResponse.json({ error: "ส่วนลดต้องอยู่ระหว่าง 0-100" }, { status: 400 });
        }

        // Check if setting exists
        const [existing] = await pool.query<RowDataPacket[]>(
            "SELECT id FROM settings WHERE shop_id = ? AND setting_key = 'agent_discount_percent'",
            [shopId]
        );

        if (existing.length > 0) {
            await pool.query<ResultSetHeader>(
                "UPDATE settings SET setting_value = ? WHERE shop_id = ? AND setting_key = 'agent_discount_percent'",
                [String(agent_discount_percent), shopId]
            );
        } else {
            await pool.query<ResultSetHeader>(
                "INSERT INTO settings (shop_id, setting_key, setting_value) VALUES (?, 'agent_discount_percent', ?)",
                [shopId, String(agent_discount_percent)]
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update Agent Settings Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
