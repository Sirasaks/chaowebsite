import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import crypto from "crypto";
import { sendMail } from "@/lib/mail";
import { getShopIdFromRequest } from "@/lib/shop-helper";
import { rateLimit } from "@/lib/rate-limit";
import { logSecurityEvent, logRateLimitExceeded } from "@/lib/security-logger";

export async function POST(request: Request) {
    const shopId = await getShopIdFromRequest(request);
    if (!shopId) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    // Rate limiting: 3 attempts per minute per IP per shop
    const ip = (request.headers.get("x-forwarded-for") ?? "127.0.0.1").split(",")[0];
    const { success } = rateLimit(`shop-forgot:${shopId}:${ip}`, { limit: 3, windowMs: 60000 });

    if (!success) {
        logRateLimitExceeded(request, '/api/shop/auth/forgot-password', shopId);
        return NextResponse.json({ error: "ทำรายการเร็วเกินไป กรุณารอ 1 นาที" }, { status: 429 });
    }

    const connection = await pool.getConnection();
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: "กรุณากรอกอีเมล" }, { status: 400 });
        }

        // 1. Check if user exists IN THIS SHOP
        const [users] = await connection.query<RowDataPacket[]>(
            "SELECT id FROM users WHERE email = ? AND shop_id = ?",
            [email, shopId]
        );

        if (users.length === 0) {
            // Timing Attack Mitigation: Fake delay (1-2 seconds)
            // To mask the difference between sending mail vs doing nothing
            const fakeDelay = Math.floor(Math.random() * 1000) + 1000;
            await new Promise(resolve => setTimeout(resolve, fakeDelay));

            logSecurityEvent('PASSWORD_RESET_REQUESTED', {
                ip,
                email, // Log email but label as 'not_found' in reason implicitly or explicitly if needed, but 'requested' handles both.
                shopId,
                status: 'user_not_found'
            });

            // Don't reveal that user doesn't exist
            return NextResponse.json({ message: "หากอีเมลนี้มีอยู่ในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปให้แล้ว" });
        }

        // 2. Generate Token (plain for email, hashed for storage)
        const plainToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(plainToken).digest("hex");

        // 3. Save to DB (password_resets table might need shop_id too? Or just email/token is enough?)
        // The password_resets table structure is: email, token, created_at.
        // It doesn't have shop_id.
        // However, since email + shop_id is unique, and we verified the email exists in this shop...
        // Wait, if same email exists in Shop A and Shop B.
        // User requests reset for Shop A.
        // We insert (email, token).
        // User clicks link.
        // Reset API updates password for `email`.
        // IT WILL UPDATE FOR BOTH SHOPS!
        // This is a problem. `password_resets` needs `shop_id` OR the reset logic needs to know the shop.
        // But the reset link is clicked in a browser, likely on the shop's domain.
        // So the Reset API will know the shop from the domain.
        // So we just need to ensure the Reset API uses the shop_id from the domain to filter the user update.

        // Self-healing: Ensure table has shop_id
        try {
            const [columns] = await connection.query<RowDataPacket[]>("SHOW COLUMNS FROM password_resets LIKE 'shop_id'");
            if (columns.length === 0) {
                await connection.query("ALTER TABLE password_resets ADD COLUMN shop_id INT NOT NULL DEFAULT 0");
                await connection.query("ALTER TABLE password_resets ADD INDEX idx_token_shop (token, shop_id)");
            }
        } catch (err) {
            // Ignore error
        }

        // Delete any existing tokens for this email and shop
        await connection.query(
            "DELETE FROM password_resets WHERE email = ? AND shop_id = ?",
            [email, shopId]
        );

        // Save HASHED token (not plain)
        await connection.query(
            "INSERT INTO password_resets (email, token, shop_id) VALUES (?, ?, ?)",
            [email, hashedToken, shopId]
        );

        // 4. Send Email
        // We should probably include the shop domain in the link to ensure they reset on the correct shop.
        // The `request.headers.get("host")` should give us the shop domain.
        const host = request.headers.get("host");
        const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
        const resetLink = `${protocol}://${host}/reset-password?token=${plainToken}`;

        try {
            await sendMail({
                to: email,
                subject: "รีเซ็ตรหัสผ่าน - My Shop",
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
            shopId,
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
