import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import crypto from "crypto";
import { sendMail } from "@/lib/mail";

export async function POST(request: Request) {
    const connection = await pool.getConnection();
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: "กรุณากรอกอีเมล" }, { status: 400 });
        }

        // 1. Check if user exists
        const [users] = await connection.query<RowDataPacket[]>(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            // Don't reveal that user doesn't exist
            return NextResponse.json({ message: "หากอีเมลนี้มีอยู่ในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปให้แล้ว" });
        }

        // 2. Generate Token
        const token = crypto.randomBytes(32).toString("hex");

        // 3. Save to DB
        await connection.query(
            "INSERT INTO password_resets (email, token) VALUES (?, ?)",
            [email, token]
        );

        // 4. Send Email
        const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`;

        try {
            await sendMail({
                to: email,
                subject: "รีเซ็ตรหัสผ่าน - My Shop",
                html: `
                    <h1>รีเซ็ตรหัสผ่าน</h1>
                    <p>คุณได้ทำการร้องขอให้รีเซ็ตรหัสผ่าน กรุณาคลิกลิงก์ด้านล่างเพื่อตั้งรหัสผ่านใหม่:</p>
                    <a href="${resetLink}">${resetLink}</a>
                    <p>หากคุณไม่ได้เป็นผู้ร้องขอ กรุณาเพิกเฉยต่ออีเมลฉบับนี้</p>
                `,
            });
        } catch (mailError) {
            console.error("Failed to send email:", mailError);
            // Log link as fallback if email fails (e.g. missing config)
            console.log("Fallback Reset Link:", resetLink);
        }

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
