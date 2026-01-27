import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { RowDataPacket } from "mysql2";
import { getJwtSecret } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-logger";

export async function POST(request: Request) {
    // Rate limiting: 5 attempts per minute per IP
    const ip = (request.headers.get("x-forwarded-for") ?? "127.0.0.1").split(",")[0];
    const { success } = rateLimit(`master-change-pwd:${ip}`, { limit: 5, windowMs: 60000 });

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
        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
        }

        // 3. Verify Current Password
        const [users] = await connection.query<RowDataPacket[]>(
            "SELECT id, username, password FROM master_users WHERE id = ?",
            [userId]
        );

        if (users.length === 0) {
            return NextResponse.json({ error: "ไม่พบผู้ใช้งาน" }, { status: 404 });
        }

        const user = users[0];
        const passwordMatch = await bcrypt.compare(currentPassword, user.password);

        if (!passwordMatch) {
            logSecurityEvent('PASSWORD_CHANGE_FAILED', { ip, userId, username: user.username, reason: 'invalid_current_password' });
            return NextResponse.json({ error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" }, { status: 400 });
        }

        // 4. Update Password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await connection.query(
            "UPDATE master_users SET password = ? WHERE id = ?",
            [hashedPassword, userId]
        );

        logSecurityEvent('PASSWORD_CHANGE_SUCCESS', { ip, userId, username: user.username });

        return NextResponse.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });

    } catch (error: any) {
        console.error("Change Password Error:", error);
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
