import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { RowDataPacket } from "mysql2";
import { getJwtSecret } from "@/lib/env";

export async function POST(request: Request) {
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
            const decoded = jwt.verify(token, getJwtSecret()) as { userId: number; tokenType?: string };

            // Verify this is a master token
            if (decoded.tokenType && decoded.tokenType !== 'master') {
                return NextResponse.json({ error: "Token ไม่ถูกต้อง (Invalid scope)" }, { status: 401 });
            }

            // Verify user exists in master_users
            const [userCheck] = await connection.query<RowDataPacket[]>(
                "SELECT id FROM master_users WHERE id = ?",
                [decoded.userId]
            );
            if (userCheck.length === 0) {
                return NextResponse.json({ error: "User not found" }, { status: 401 });
            }

            userId = decoded.userId;
        } catch (err) {
            return NextResponse.json({ error: "Token ไม่ถูกต้อง" }, { status: 401 });
        }

        // 2. Parse Form Data
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "กรุณาอัพโหลดรูปภาพ" }, { status: 400 });
        }

        // 3. Fetch SlipOk settings from master_settings
        const [settingsRows] = await connection.query<RowDataPacket[]>(
            "SELECT setting_key, setting_value FROM master_settings WHERE setting_key IN ('slipok_api_key', 'slipok_branch_id')"
        );

        const settings: Record<string, string> = {};
        settingsRows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });

        const SLIPOK_API_KEY = settings.slipok_api_key || process.env.SLIPOK_API_KEY;
        const SLIPOK_BRANCH_ID = settings.slipok_branch_id || process.env.SLIPOK_BRANCH_ID;

        if (!SLIPOK_API_KEY || !SLIPOK_BRANCH_ID) {
            console.error("SlipOk configuration missing (Master)");
            return NextResponse.json({ error: "System configuration error" }, { status: 500 });
        }

        // 4. Send to SlipOk API
        const slipOkFormData = new FormData();
        slipOkFormData.append("files", file);
        slipOkFormData.append("log", "true"); // Enable duplicate checking

        const slipOkResponse = await fetch(`https://api.slipok.com/api/line/apikey/${SLIPOK_BRANCH_ID}`, {
            method: "POST",
            headers: {
                "x-authorization": SLIPOK_API_KEY,
            },
            body: slipOkFormData,
        });

        const slipData = await slipOkResponse.json();

        if (!slipOkResponse.ok || !slipData.success) {
            console.error("SlipOk Error:", slipData);
            return NextResponse.json(
                { error: slipData.message || "สลิปไม่ถูกต้อง หรือไม่สามารถตรวจสอบได้" },
                { status: 400 }
            );
        }

        const { transRef, amount, sender, receiver } = slipData.data;

        // Check minimum amount
        if (amount < 10) {
            return NextResponse.json(
                { error: "ยอดเติมเงินขั้นต่ำ 10 บาท" },
                { status: 400 }
            );
        }

        // 5. Database Transaction
        await connection.beginTransaction();

        // Check for duplicate transaction in master_topup_history
        const [existing] = await connection.query<RowDataPacket[]>(
            "SELECT id FROM master_topup_history WHERE trans_ref = ? FOR UPDATE",
            [transRef]
        );

        if (existing.length > 0) {
            await connection.rollback();
            return NextResponse.json(
                { error: "สลิปนี้ถูกใช้งานไปแล้ว" },
                { status: 400 }
            );
        }

        // Update Master User Credit
        await connection.query(
            "UPDATE master_users SET credit = credit + ? WHERE id = ?",
            [amount, userId]
        );

        // Record Transaction
        await connection.query(
            "INSERT INTO master_topup_history (user_id, trans_ref, amount, sender_name, receiver_name, status) VALUES (?, ?, ?, ?, ?, 'completed')",
            [userId, transRef, amount, sender?.displayName || "Unknown", receiver?.displayName || "Unknown"]
        );

        await connection.commit();

        return NextResponse.json({
            success: true,
            amount: amount,
            message: "เติมเงินสำเร็จ"
        });

    } catch (error: any) {
        await connection.rollback();
        console.error("Topup Error:", error);
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์: " + error.message },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
