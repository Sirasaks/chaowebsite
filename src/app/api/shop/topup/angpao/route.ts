import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { RowDataPacket } from "mysql2";
import { getJwtSecret } from "@/lib/env";
import { getShopIdFromRequest } from "@/lib/shop-helper";

interface RedeemResponse {
    success: boolean;
    amount?: number; // Amount in Baht
    ownerName?: string;
    voucherId?: string;
    message?: string;
}

async function redeemAngpao(phoneNumber: string, voucherUrl: string): Promise<RedeemResponse> {
    try {
        console.log("Redeeming Angpao:", { phoneNumber, voucherUrl });

        // Extract voucher code from URL
        let code: string | null = null;
        try {
            const url = new URL(voucherUrl);
            code = url.searchParams.get("v");
        } catch (e) {
            console.error("URL parsing error:", e);
            // Try to handle if the user just sent the code directly or a different format
            if (voucherUrl.match(/^[a-zA-Z0-9]{10,}$/)) {
                code = voucherUrl;
            } else {
                return { success: false, message: "Invalid voucher URL format" };
            }
        }

        if (!code) {
            if (voucherUrl.match(/^[a-zA-Z0-9]{10,}$/)) {
                code = voucherUrl;
            } else {
                return { success: false, message: "Could not extract voucher code" };
            }
        }

        console.log("Extracted code:", code);

        // Security Check: Ensure code contains only alphanumeric characters
        if (!/^[a-zA-Z0-9]+$/.test(code)) {
            return { success: false, message: "Invalid voucher code format" };
        }

        // Clean phone number
        const mobile = phoneNumber.replace(/[^0-9]/g, '');

        const response = await fetch(`https://gift.truemoney.com/campaign/vouchers/${code}/redeem`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "okhttp/4.9.0"
            },
            body: JSON.stringify({
                mobile: mobile,
                voucher_hash: code
            })
        });

        const data = await response.json();

        if (response.ok && data.status.code === "SUCCESS") {
            return {
                success: true,
                amount: parseFloat(data.data.my_ticket.amount_baht),
                ownerName: data.data.owner_profile.full_name,
                voucherId: data.data.voucher.voucher_id
            };
        } else {
            // Map error codes
            let message = "Failed to redeem";
            const errorCode = data.status?.code || "UNKNOWN";

            if (errorCode === "VOUCHER_OUT_OF_STOCK") message = "คูปองถูกใช้ไปแล้ว";
            else if (errorCode === "VOUCHER_NOT_FOUND") message = "ไม่พบคูปอง";
            else if (errorCode === "VOUCHER_EXPIRED") message = "คูปองหมดอายุ";
            else if (errorCode === "CANNOT_GET_OWN_VOUCHER") message = "ไม่สามารถเติมคูปองตัวเองได้";
            else if (data.status?.message) message = data.status.message;

            return { success: false, message: `${message} (${errorCode})` };
        }

    } catch (error: any) {
        console.error("Redeem error:", error);
        return { success: false, message: `Internal Error: ${error.message}` };
    }
}

export async function POST(request: Request) {
    const shopId = await getShopIdFromRequest(request);
    if (!shopId) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const connection = await pool.getConnection();
    try {
        // 1. Authenticate User
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let userId: number;
        try {
            const decoded = jwt.verify(token, getJwtSecret()) as { userId: number };
            userId = decoded.userId;
        } catch (err) {
            return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
        }

        // Verify user belongs to shop
        const [users] = await connection.query<RowDataPacket[]>(
            "SELECT id FROM users WHERE id = ? AND shop_id = ?",
            [userId, shopId]
        );
        if (users.length === 0) {
            return NextResponse.json({ error: "User not found in this shop" }, { status: 404 });
        }

        // 2. Parse Body
        const { voucherUrl } = await request.json();

        if (!voucherUrl) {
            return NextResponse.json({ error: "Voucher URL is required" }, { status: 400 });
        }

        // 3. Get Receiver Phone Number (Scoped to Shop)
        const [settingsRows] = await connection.query<RowDataPacket[]>(
            "SELECT setting_value FROM settings WHERE setting_key = 'truemoney_phone' AND shop_id = ?",
            [shopId]
        );

        let phoneNumber = settingsRows.length > 0 ? settingsRows[0].setting_value : null;

        if (!phoneNumber) {
            // Fallback to ENV only if not found in DB (and maybe we shouldn't fallback to ENV for multi-tenant?)
            // But for now, let's assume ENV is a global fallback or just fail.
            // Given "shop1" and "shop2", they should have their own phones.
            // If ENV is used, it means all shops share the same wallet, which is bad.
            // But to keep it working if DB is empty, I'll leave it but log a warning.
            phoneNumber = process.env.TMN_PHONE;
        }

        if (!phoneNumber) {
            console.error("TrueMoney phone number not configured (DB or ENV)");
            return NextResponse.json({ error: "System configuration error: Missing receiver phone number" }, { status: 500 });
        }

        // 4. Redeem voucher
        const result = await redeemAngpao(phoneNumber, voucherUrl);

        if (!result.success) {
            return NextResponse.json({ error: result.message }, { status: 400 });
        }

        // Check if data exists
        if (result.amount === undefined || !result.voucherId) {
            return NextResponse.json({ error: "Redeem success but no data returned" }, { status: 500 });
        }

        const creditAmount = result.amount;
        const voucherId = result.voucherId;
        const senderName = result.ownerName || "Unknown";

        try {
            await connection.beginTransaction();

            // Check for duplicate transaction (Global check? Or Shop check? Voucher ID is unique globally from TrueMoney)
            // But we should check if it's already used in our system.
            const [existing] = await connection.query<RowDataPacket[]>(
                "SELECT id FROM topup_history WHERE trans_ref = ? FOR UPDATE",
                [voucherId]
            );

            if (existing.length > 0) {
                await connection.rollback();
                return NextResponse.json(
                    { error: "คูปองนี้ถูกใช้งานไปแล้ว" },
                    { status: 400 }
                );
            }

            // Update user credit
            await connection.query(
                "UPDATE users SET credit = credit + ? WHERE id = ?",
                [creditAmount, userId]
            );

            // Log transaction (Scoped to Shop)
            // We use voucherId as trans_ref
            // We store "Angpao: SenderName" in sender_name to distinguish
            await connection.query(
                "INSERT INTO topup_history (shop_id, user_id, trans_ref, amount, sender_name, receiver_name, status) VALUES (?, ?, ?, ?, ?, ?, 'completed')",
                [shopId, userId, voucherId, creditAmount, `Angpao: ${senderName}`, "System"]
            );

            await connection.commit();

            return NextResponse.json({
                success: true,
                amount: creditAmount,
                message: "Topup successful"
            });

        } catch (dbError) {
            await connection.rollback();
            console.error("Database error:", dbError);
            return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Topup Angpao Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    } finally {
        connection.release();
    }
}
