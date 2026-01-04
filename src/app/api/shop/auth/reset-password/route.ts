import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { getShopIdFromRequest } from "@/lib/shop-helper";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
    const shopId = await getShopIdFromRequest(request);
    if (!shopId) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    // Rate limiting: 5 attempts per minute per IP per shop
    const ip = (request.headers.get("x-forwarded-for") ?? "127.0.0.1").split(",")[0];
    const { success } = rateLimit(`shop-reset:${shopId}:${ip}`, { limit: 5, windowMs: 60000 });

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

        // 1. Verify Token and Shop ID (compare with hashed token)
        const [resets] = await connection.query<RowDataPacket[]>(
            "SELECT email, created_at FROM password_resets WHERE token = ? AND shop_id = ?",
            [hashedToken, shopId]
        );

        if (resets.length === 0) {
            return NextResponse.json({ error: "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง หรือหมดอายุ หรือไม่สามารถใช้กับร้านค้านี้ได้" }, { status: 400 });
        }

        // Check if token is expired (1 hour)
        const createdAt = new Date(resets[0].created_at);
        const now = new Date();
        const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

        if (hoursDiff > 1) {
            // Delete expired token
            await connection.query("DELETE FROM password_resets WHERE token = ?", [hashedToken]);
            return NextResponse.json({ error: "ลิงก์รีเซ็ตรหัสผ่านหมดอายุแล้ว กรุณาขอลิงก์ใหม่" }, { status: 400 });
        }

        const email = resets[0].email;

        // 2. Update Password (SCOPED TO SHOP)
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const [result] = await connection.query(
            "UPDATE users SET password = ? WHERE email = ? AND shop_id = ?",
            [hashedPassword, email, shopId]
        );

        // Check if user exists in this shop
        // If affectedRows is 0, it means the email from the token doesn't exist in this shop.
        // This could happen if they requested reset on Shop A but clicked link on Shop B (if we didn't fix the link).
        // But since we fixed the link to use `host`, this should match.

        // 3. Delete Token (use hashed token)
        await connection.query(
            "DELETE FROM password_resets WHERE token = ?",
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
