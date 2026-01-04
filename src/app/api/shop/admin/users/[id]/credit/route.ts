import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";
import { getShopIdFromRequest } from "@/lib/shop-helper";
import { z } from "zod";

// Helper to check admin role with shop scope
async function checkAdmin(shopId: number): Promise<{ isAdmin: boolean; adminId?: number }> {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return { isAdmin: false };

    try {
        const decoded = jwt.verify(token, getJwtSecret()) as { userId: number };
        const [users] = await pool.query<RowDataPacket[]>(
            "SELECT id, role FROM users WHERE id = ? AND shop_id = ?",
            [decoded.userId, shopId]
        );
        if (users.length > 0 && users[0].role === 'owner') {
            return { isAdmin: true, adminId: users[0].id };
        }
        return { isAdmin: false };
    } catch (error) {
        return { isAdmin: false };
    }
}

const creditSchema = z.object({
    amount: z.number().min(0.01, "จำนวนต้องมากกว่า 0"),
    type: z.enum(["add", "subtract"]),
    note: z.string().max(255).optional(),
});

// POST: Add/Subtract credit for user
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const shopId = await getShopIdFromRequest(request);
    if (!shopId) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const { isAdmin, adminId } = await checkAdmin(shopId);
    if (!isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = parseInt(id);

    const connection = await pool.getConnection();
    try {
        const body = await request.json();
        const { amount, type, note } = creditSchema.parse(body);

        await connection.beginTransaction();

        // Get current user credit
        const [users] = await connection.query<RowDataPacket[]>(
            "SELECT credit, username FROM users WHERE id = ? AND shop_id = ? AND IFNULL(is_deleted, 0) = 0 FOR UPDATE",
            [userId, shopId]
        );

        if (users.length === 0) {
            await connection.rollback();
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const currentCredit = parseFloat(users[0].credit);
        let newCredit: number;

        if (type === "add") {
            newCredit = currentCredit + amount;
        } else {
            if (currentCredit < amount) {
                await connection.rollback();
                return NextResponse.json({ error: "เครดิตไม่เพียงพอสำหรับหักลบ" }, { status: 400 });
            }
            newCredit = currentCredit - amount;
        }

        // Update user credit
        await connection.query<ResultSetHeader>(
            "UPDATE users SET credit = ? WHERE id = ? AND shop_id = ?",
            [newCredit, userId, shopId]
        );

        // Log credit change
        await connection.query<ResultSetHeader>(
            `INSERT INTO credit_logs (shop_id, user_id, amount, type, note, admin_id, balance_before, balance_after)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [shopId, userId, amount, type, note || null, adminId, currentCredit, newCredit]
        );

        await connection.commit();

        return NextResponse.json({
            success: true,
            message: type === "add" ? "เพิ่มเครดิตสำเร็จ" : "หักเครดิตสำเร็จ",
            newCredit
        });
    } catch (error: any) {
        await connection.rollback();
        console.error("Credit Update Error:", error);
        if (error.name === "ZodError") {
            return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        connection.release();
    }
}
