import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { RowDataPacket } from "mysql2";
import { getJwtSecret } from "@/lib/env";
import { getShopIdFromRequest } from "@/lib/shop-helper";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
    const shopId = await getShopIdFromRequest(request);
    if (!shopId) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    // Rate limiting: 10 topup attempts per minute per IP per shop
    const ip = (request.headers.get("x-forwarded-for") ?? "127.0.0.1").split(",")[0];
    const { success: rateLimitSuccess } = rateLimit(`shop-topup:${shopId}:${ip}`, { limit: 10, windowMs: 60000 });

    if (!rateLimitSuccess) {
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

        // Verify user belongs to shop
        const [users] = await connection.query<RowDataPacket[]>(
            "SELECT id FROM users WHERE id = ? AND shop_id = ?",
            [userId, shopId]
        );
        if (users.length === 0) {
            return NextResponse.json({ error: "User not found in this shop" }, { status: 404 });
        }

        // 2. Parse Form Data
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "กรุณาอัพโหลดรูปภาพ" }, { status: 400 });
        }

        // 3. Fetch EasySlip settings from database (Scoped to Shop)
        const [settingsRows] = await connection.query<RowDataPacket[]>(
            "SELECT setting_key, setting_value FROM settings WHERE setting_key = 'easyslip_access_token' AND shop_id = ?",
            [shopId]
        );

        const settings: Record<string, string> = {};
        settingsRows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
        });

        const EASYSLIP_ACCESS_TOKEN = settings.easyslip_access_token || process.env.EASYSLIP_ACCESS_TOKEN;

        if (!EASYSLIP_ACCESS_TOKEN) {
            console.error("EasySlip configuration missing");
            return NextResponse.json({ error: "System configuration error" }, { status: 500 });
        }

        // 4. Send to EasySlip API
        const easySlipFormData = new FormData();
        easySlipFormData.append("file", file);
        easySlipFormData.append("checkDuplicate", "true"); // Enable duplicate checking

        const easySlipResponse = await fetch("https://developer.easyslip.com/api/v1/verify", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${EASYSLIP_ACCESS_TOKEN}`,
            },
            body: easySlipFormData,
        });

        const slipData = await easySlipResponse.json();

        if (slipData.status !== 200) {
            console.error("EasySlip Error:", slipData);

            // Map EasySlip error messages to Thai
            let errorMessage = "สลิปไม่ถูกต้อง หรือไม่สามารถตรวจสอบได้";
            if (slipData.message === "duplicate_slip") {
                errorMessage = "สลิปนี้ถูกใช้งานไปแล้ว";
            } else if (slipData.message === "slip_not_found" || slipData.message === "qrcode_not_found") {
                errorMessage = "ไม่พบข้อมูลสลิป หรือสลิปไม่ถูกต้อง";
            } else if (slipData.message === "invalid_image") {
                errorMessage = "รูปภาพไม่ถูกต้อง กรุณาอัปโหลดรูปสลิปใหม่";
            } else if (slipData.message === "image_size_too_large") {
                errorMessage = "ขนาดรูปภาพใหญ่เกินไป";
            } else if (slipData.message === "quota_exceeded") {
                errorMessage = "โควต้าการตรวจสอบสลิปหมด กรุณาติดต่อผู้ดูแลระบบ";
            } else if (slipData.message === "unauthorized") {
                errorMessage = "การยืนยันตัวตนล้มเหลว กรุณาติดต่อผู้ดูแลระบบ";
            }

            return NextResponse.json(
                { error: errorMessage },
                { status: 400 }
            );
        }

        // Extract data from EasySlip response
        const transRef = slipData.data.transRef;
        const amount = slipData.data.amount.amount;
        const slipDate = slipData.data.date; // e.g., "2023-01-01T00:00:00+07:00"
        const sender = { displayName: slipData.data.sender?.account?.name?.th || slipData.data.sender?.account?.name?.en || "Unknown" };
        const receiver = { displayName: slipData.data.receiver?.account?.name?.th || slipData.data.receiver?.account?.name?.en || "Unknown" };

        // Check if slip is not older than 24 hours
        if (slipDate) {
            const slipDateTime = new Date(slipDate).getTime();
            const now = Date.now();
            const hoursDiff = (now - slipDateTime) / (1000 * 60 * 60);

            if (hoursDiff > 24) {
                console.error(`Slip too old: ${slipDate}, hours diff: ${hoursDiff}`);
                return NextResponse.json(
                    { error: "สลิปนี้เก่าเกินไป กรุณาใช้สลิปที่โอนภายใน 24 ชั่วโมง" },
                    { status: 400 }
                );
            }
        }

        // Get receiver account number from slip (could be bank account or proxy like PromptPay)
        const receiverBankAccount = slipData.data.receiver?.account?.bank?.account?.replace(/[^0-9]/g, '') || '';
        const receiverProxyAccount = slipData.data.receiver?.account?.proxy?.account?.replace(/[^0-9]/g, '') || '';

        // 5. Verify receiver account matches shop's configured bank account
        const [shopBankSettings] = await connection.query<RowDataPacket[]>(
            "SELECT setting_key, setting_value FROM settings WHERE setting_key = 'bank_account_number' AND shop_id = ?",
            [shopId]
        );

        const shopBankAccountRaw = shopBankSettings.find(s => s.setting_key === 'bank_account_number')?.setting_value || '';
        const shopBankAccount = shopBankAccountRaw.replace(/[^0-9]/g, ''); // Remove dashes and spaces

        if (!shopBankAccount) {
            console.error("Shop bank account not configured");
            return NextResponse.json(
                { error: "ร้านค้ายังไม่ได้ตั้งค่าบัญชีธนาคาร กรุณาติดต่อผู้ดูแลระบบ" },
                { status: 500 }
            );
        }

        // Check if receiver account matches (check both bank account and proxy/PromptPay)
        const isValidReceiver =
            (receiverBankAccount && receiverBankAccount.includes(shopBankAccount.slice(-4))) ||
            (receiverBankAccount && shopBankAccount.includes(receiverBankAccount.slice(-4))) ||
            (receiverProxyAccount && receiverProxyAccount.includes(shopBankAccount.slice(-4))) ||
            (receiverProxyAccount && shopBankAccount.includes(receiverProxyAccount.slice(-4)));

        if (!isValidReceiver) {
            console.error(`Receiver account mismatch. Shop: ${shopBankAccount}, Slip Bank: ${receiverBankAccount}, Slip Proxy: ${receiverProxyAccount}`);
            return NextResponse.json(
                { error: "บัญชีผู้รับเงินในสลิปไม่ตรงกับบัญชีร้านค้า กรุณาโอนเงินมายังบัญชีที่ถูกต้อง" },
                { status: 400 }
            );
        }

        // Check minimum amount
        if (amount < 10) {
            return NextResponse.json(
                { error: "ยอดเติมเงินขั้นต่ำ 10 บาท" },
                { status: 400 }
            );
        }

        // 5. Database Transaction
        await connection.beginTransaction();

        // Check for duplicate transaction in OUR database
        const [existing] = await connection.query<RowDataPacket[]>(
            "SELECT id FROM topup_history WHERE trans_ref = ? AND shop_id = ? FOR UPDATE",
            [transRef, shopId]
        );

        if (existing.length > 0) {
            await connection.rollback();
            return NextResponse.json(
                { error: "สลิปนี้ถูกใช้งานไปแล้ว" },
                { status: 400 }
            );
        }

        // Update User Credit
        await connection.query(
            "UPDATE users SET credit = credit + ? WHERE id = ? AND shop_id = ?",
            [amount, userId, shopId]
        );

        // Record Transaction (Scoped to Shop)
        await connection.query(
            "INSERT INTO topup_history (shop_id, user_id, trans_ref, amount, sender_name, receiver_name) VALUES (?, ?, ?, ?, ?, ?)",
            [shopId, userId, transRef, amount, sender?.displayName || "Unknown", receiver?.displayName || "Unknown"]
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
            { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
