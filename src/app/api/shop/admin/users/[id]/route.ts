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

// GET: Get single user details
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const shopId = await getShopIdFromRequest(request);
    if (!shopId) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    if (!await checkAdmin(shopId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = parseInt(id);

    try {
        const [users] = await pool.query<RowDataPacket[]>(
            `SELECT id, username, email, role, credit, created_at 
             FROM users WHERE id = ? AND shop_id = ? AND IFNULL(is_deleted, 0) = 0`,
            [userId, shopId]
        );

        if (users.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Get recent orders
        const [orders] = await pool.query<RowDataPacket[]>(
            `SELECT o.id, p.name as product_name, o.price, o.quantity, o.status, o.created_at
             FROM orders o
             JOIN products p ON o.product_id = p.id
             WHERE o.user_id = ? AND o.shop_id = ?
             ORDER BY o.created_at DESC LIMIT 10`,
            [userId, shopId]
        );

        // Get credit log
        const [creditLogs] = await pool.query<RowDataPacket[]>(
            `SELECT id, amount, type, note, created_at
             FROM credit_logs
             WHERE user_id = ? AND shop_id = ?
             ORDER BY created_at DESC LIMIT 20`,
            [userId, shopId]
        );

        return NextResponse.json({
            user: users[0],
            recentOrders: orders,
            creditLogs
        });
    } catch (error) {
        console.error("Get User Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE: Soft delete user
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const shopId = await getShopIdFromRequest(request);
    if (!shopId) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    if (!await checkAdmin(shopId)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = parseInt(id);

    try {
        // Check user exists and is not owner
        const [users] = await pool.query<RowDataPacket[]>(
            "SELECT role FROM users WHERE id = ? AND shop_id = ?",
            [userId, shopId]
        );

        if (users.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (users[0].role === 'owner') {
            return NextResponse.json({ error: "ไม่สามารถลบเจ้าของร้านได้" }, { status: 400 });
        }

        // Soft delete
        await pool.query<ResultSetHeader>(
            "UPDATE users SET is_deleted = 1 WHERE id = ? AND shop_id = ?",
            [userId, shopId]
        );

        return NextResponse.json({ success: true, message: "ลบสมาชิกสำเร็จ" });
    } catch (error) {
        console.error("Delete User Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
