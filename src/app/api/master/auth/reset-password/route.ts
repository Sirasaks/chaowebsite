import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
    // Rate limiting: 5 attempts per minute per IP
    const ip = (request.headers.get("x-forwarded-for") ?? "127.0.0.1").split(",")[0];
    const { success } = rateLimit(`master-reset:${ip}`, { limit: 5, windowMs: 60000 });

    if (!success) {
        return NextResponse.json({ error: "ทำรายการเร็วเกินไป กรุณารอ 1 นาที" }, { status: 429 });
    }

    const connection = await pool.getConnection();
    try {
        const { token, newPassword } = await request.json();

        if (!token || !newPassword) {
            return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: "รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
        }

        // Hash the incoming token to compare with stored hash
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        // 1. Verify Token (compare with hashed token in database)
        const [resets] = await connection.query<RowDataPacket[]>(
            "SELECT email, created_at FROM master_password_resets WHERE token = ?",
            [hashedToken]
        );

        if (resets.length === 0) {
            return NextResponse.json({ error: "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง หรือหมดอายุ" }, { status: 400 });
        }

        // Check if token is expired (1 hour instead of 24)
        const createdAt = new Date(resets[0].created_at);
        const now = new Date();
        const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

        if (hoursDiff > 1) {
            // Delete expired token
            await connection.query("DELETE FROM master_password_resets WHERE token = ?", [hashedToken]);
            return NextResponse.json({ error: "ลิงก์รีเซ็ตรหัสผ่านหมดอายุแล้ว กรุณาขอลิงก์ใหม่" }, { status: 400 });
        }

        const email = resets[0].email;

        // 2. Update Password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await connection.query(
            "UPDATE master_users SET password = ? WHERE email = ?",
            [hashedPassword, email]
        );

        // 3. Delete Token (use hashed token)
        await connection.query(
            "DELETE FROM master_password_resets WHERE token = ?",
            [hashedToken]
        );

        return NextResponse.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });

    } catch (error) {
        console.error("Reset Password Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        connection.release();
    }
}
