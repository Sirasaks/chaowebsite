import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import crypto from "crypto";
import { sendMail } from "@/lib/mail";
import { rateLimit } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-logger";

export async function POST(request: Request) {
    // Rate limiting: 3 attempts per minute per IP
    const ip = (request.headers.get("x-forwarded-for") ?? "127.0.0.1").split(",")[0];
    const { success } = rateLimit(`master-forgot:${ip}`, { limit: 3, windowMs: 60000 });

    if (!success) {
        logSecurityEvent('RATE_LIMIT_EXCEEDED', { ip, endpoint: '/api/master/auth/forgot-password' });
        return NextResponse.json({ error: "ทำรายการเร็วเกินไป กรุณารอ 1 นาที" }, { status: 429 });
    }

    const connection = await pool.getConnection();
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: "กรุณากรอกอีเมล" }, { status: 400 });
        }

        // 1. Check if master user exists
        const [users] = await connection.query<RowDataPacket[]>(
            "SELECT id FROM master_users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            // ✅ Timing Attack Mitigation: Fake delay (1-2 seconds)
            const fakeDelay = Math.floor(Math.random() * 1000) + 1000;
            await new Promise(resolve => setTimeout(resolve, fakeDelay));

            logSecurityEvent('PASSWORD_RESET_REQUESTED', {
                ip,
                email,
                status: 'user_not_found'
            });

            // Don't reveal that user doesn't exist
            return NextResponse.json({ message: "หากอีเมลนี้มีอยู่ในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปให้แล้ว" });
        }

        // 2. Generate Token (plain token for email, hashed for storage)
        const plainToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(plainToken).digest("hex");

        // 3. Self-healing: Ensure master_password_resets table exists
        try {
            await connection.query(`
                CREATE TABLE IF NOT EXISTS master_password_resets (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    email VARCHAR(255) NOT NULL,
                    token VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_token (token),
                    INDEX idx_email (email)
                )
            `);
        } catch (err) {
            // Ignore error if table already exists
        }

        // 4. Delete any existing tokens for this email
        await connection.query(
            "DELETE FROM master_password_resets WHERE email = ?",
            [email]
        );

        // 5. Save HASHED token (not plain token)
        await connection.query(
            "INSERT INTO master_password_resets (email, token) VALUES (?, ?)",
            [email, hashedToken]
        );

        // 6. Send Email with PLAIN token (user will send this back)
        const host = request.headers.get("host");
        const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
        const resetLink = `${protocol}://${host}/reset-password?token=${plainToken}`;

        try {
            await sendMail({
                to: email,
                subject: "รีเซ็ตรหัสผ่าน - ChaoWeb",
                html: `
                    <h1>รีเซ็ตรหัสผ่าน</h1>
                    <p>คุณได้ทำการร้องขอให้รีเซ็ตรหัสผ่าน กรุณาคลิกลิงก์ด้านล่างเพื่อตั้งรหัสผ่านใหม่:</p>
                    <a href="${resetLink}">${resetLink}</a>
                    <p>ลิงก์นี้จะหมดอายุใน 1 ชั่วโมง</p>
                    <p>หากคุณไม่ได้เป็นผู้ร้องขอ กรุณาเพิกเฉยต่ออีเมลฉบับนี้</p>
                `,
            });
        } catch (mailError) {
            console.error("Failed to send email:", mailError);
        }

        logSecurityEvent('PASSWORD_RESET_REQUESTED', {
            ip,
            email,
            status: 'success'
        });

        return NextResponse.json({
            message: "หากอีเมลนี้มีอยู่ในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปให้แล้ว"
        });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        connection.release();
    }
}
