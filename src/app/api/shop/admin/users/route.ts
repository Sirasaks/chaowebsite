import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";
import { getShopIdFromRequest } from "@/lib/shop-helper";

export const dynamic = 'force-dynamic';

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

// GET: List all users in shop
export async function GET(request: Request) {
    const shopId = await getShopIdFromRequest(request);
    if (!shopId) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    if (!await checkAdmin(shopId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";

    try {
        let query = `
            SELECT 
                u.id, u.username, u.email, u.role, u.credit, u.created_at,
                IFNULL(u.agent_discount, 0) as agent_discount,
                (SELECT COUNT(*) FROM orders WHERE user_id = u.id AND shop_id = ?) as total_orders,
                (SELECT COALESCE(SUM(price * quantity), 0) FROM orders WHERE user_id = u.id AND shop_id = ?) as total_spent
            FROM users u
            WHERE u.shop_id = ? AND IFNULL(u.is_deleted, 0) = 0
        `;
        const params: any[] = [shopId, shopId, shopId];

        if (search) {
            query += ` AND (u.username LIKE ? OR u.email LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        if (role && role !== 'all') {
            query += ` AND u.role = ?`;
            params.push(role);
        }

        query += ` ORDER BY u.created_at DESC`;

        const [users] = await pool.query<RowDataPacket[]>(query, params);

        return NextResponse.json({ users });
    } catch (error) {
        console.error("Get Users Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
