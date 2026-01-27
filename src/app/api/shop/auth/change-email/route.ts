import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { RowDataPacket } from "mysql2";
import { getJwtSecret } from "@/lib/env";
import { getShopIdFromRequest } from "@/lib/shop-helper";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
    const shopId = await getShopIdFromRequest(request);
    if (!shopId) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    // Rate limiting: 5 attempts per minute per IP
    const ip = (request.headers.get("x-forwarded-for") ?? "127.0.0.1").split(",")[0];
    const { success } = rateLimit(`shop-change-email:${shopId}:${ip}`, { limit: 5, windowMs: 60000 });

    if (!success) {
        return NextResponse.json({ error: "ทำรายการเร็วเกินไป กรุณารอ 1 นาที" }, { status: 429 });
    }

    const connection = await pool.getConnection();
    try {
        // 1. Authenticate User
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
        }

        let userId: number;
        try {
            const decoded = jwt.verify(token, getJwtSecret()) as { userId: number };
            userId = decoded.userId;
        } catch (err) {
            return NextResponse.json({ error: "Token ไม่ถูกต้อง" }, { status: 401 });
        }

        // 2. Parse Request Body
        const { newEmail, password } = await request.json();

        if (!newEmail || !newEmail.includes("@")) {
            return NextResponse.json({ error: "รูปแบบอีเมลไม่ถูกต้อง" }, { status: 400 });
        }
        if (!password) {
            return NextResponse.json({ error: "กรุณาระบุรหัสผ่านเพื่อยืนยัน" }, { status: 400 });
        }

        // 3. Verify Current Password
        const [users] = await connection.query<RowDataPacket[]>(
            "SELECT password FROM users WHERE id = ? AND shop_id = ?",
            [userId, shopId]
        );

        if (users.length === 0) {
            return NextResponse.json({ error: "ไม่พบผู้ใช้งานในร้านค้านี้" }, { status: 404 });
        }

        const user = users[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 400 });
        }

        // 4. Check if new email is already taken in this shop
        // (Assuming email must be unique per shop? Or simplistic check)
        const [existing] = await connection.query<RowDataPacket[]>(
            "SELECT id FROM users WHERE email = ? AND shop_id = ? AND id != ?",
            [newEmail, shopId, userId]
        );

        if (existing.length > 0) {
            return NextResponse.json({ error: "อีเมลนี้ถูกใช้งานแล้วในร้านค้านี้" }, { status: 400 });
        }

        // 5. Update Email
        await connection.query(
            "UPDATE users SET email = ? WHERE id = ? AND shop_id = ?",
            [newEmail, userId, shopId]
        );

        return NextResponse.json({ message: "เปลี่ยนอีเมลสำเร็จ" });

    } catch (error: any) {
        console.error("Change Email Error:", error);
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
