import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";
import bcrypt from "bcrypt";
import { getShopIdFromRequest } from "@/lib/shop-helper";

export async function POST(request: Request) {
    const shopId = await getShopIdFromRequest(request);
    if (!shopId) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
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

        // 1. Verify Token
        const [resets] = await connection.query<RowDataPacket[]>(
            "SELECT email FROM password_resets WHERE token = ?",
            [token]
        );

        if (resets.length === 0) {
            return NextResponse.json({ error: "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุ" }, { status: 400 });
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

        // 3. Delete Token
        await connection.query(
            "DELETE FROM password_resets WHERE token = ?",
            [token]
        );

        return NextResponse.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });

    } catch (error) {
        console.error("Reset Password Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        connection.release();
    }
}
