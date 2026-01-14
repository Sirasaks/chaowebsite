import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { RowDataPacket } from "mysql2";
import { getJwtSecret } from "@/lib/env";

interface RedeemResponse {
    success: boolean;
    amount?: number; // Amount in Baht
    ownerName?: string;
    voucherId?: string;
    message?: string;
}

async function redeemAngpao(phoneNumber: string, voucherUrl: string): Promise<RedeemResponse> {
    try {
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
            return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
        }

        // 2. Parse Body
        const { voucherUrl } = await request.json();

        if (!voucherUrl) {
            return NextResponse.json({ error: "Voucher URL is required" }, { status: 400 });
        }

        // 3. Get Receiver Phone Number from Master Settings
        const [settingsRows] = await connection.query<RowDataPacket[]>(
            "SELECT setting_value FROM master_settings WHERE setting_key = 'truemoney_phone'"
        );

        let phoneNumber = settingsRows.length > 0 ? settingsRows[0].setting_value : null;

        if (!phoneNumber) {
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

            // Check for duplicate transaction in master_topup_history
            const [existing] = await connection.query<RowDataPacket[]>(
                "SELECT id FROM master_topup_history WHERE trans_ref = ? FOR UPDATE",
                [voucherId]
            );

            if (existing.length > 0) {
                await connection.rollback();
                return NextResponse.json(
                    { error: "คูปองนี้ถูกใช้งานไปแล้ว" },
                    { status: 400 }
                );
            }

            // Update master_users credit
            await connection.query(
                "UPDATE master_users SET credit = credit + ? WHERE id = ?",
                [creditAmount, userId]
            );

            // Log transaction
            await connection.query(
                "INSERT INTO master_topup_history (user_id, trans_ref, amount, sender_name, receiver_name, status) VALUES (?, ?, ?, ?, ?, 'completed')",
                [userId, voucherId, creditAmount, `Angpao: ${senderName}`, "System"]
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
