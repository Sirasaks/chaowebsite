import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import crypto from "crypto";
import { sendMail } from "@/lib/mail";
import { getShopIdFromRequest } from "@/lib/shop-helper";

export async function POST(request: Request) {
    const shopId = await getShopIdFromRequest(request);
    if (!shopId) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
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
            // Don't reveal that user doesn't exist
            return NextResponse.json({ message: "หากอีเมลนี้มีอยู่ในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปให้แล้ว" });
        }

        // 2. Generate Token
        const token = crypto.randomBytes(32).toString("hex");

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

        await connection.query(
            "INSERT INTO password_resets (email, token, shop_id) VALUES (?, ?, ?)",
            [email, token, shopId]
        );

        // 4. Send Email
        // We should probably include the shop domain in the link to ensure they reset on the correct shop.
        // The `request.headers.get("host")` should give us the shop domain.
        const host = request.headers.get("host");
        const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
        const resetLink = `${protocol}://${host}/reset-password?token=${token}`;

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
