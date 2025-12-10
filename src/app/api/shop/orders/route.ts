import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import { z } from "zod";
import { getJwtSecret } from "@/lib/env";
import { getShopIdFromRequest } from "@/lib/shop-helper";

// In-memory cache for request deduplication
const processedRequests = new Map<string, number>();

// Cleanup old requests every 60 seconds
setInterval(() => {
    const now = Date.now();
    for (const [key, timestamp] of processedRequests.entries()) {
        if (now - timestamp > 60000) { // 60 seconds
            processedRequests.delete(key);
        }
    }
}, 60000);

export async function POST(request: Request) {
    const shopId = await getShopIdFromRequest(request);
    if (!shopId) {
        return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const connection = await pool.getConnection();
    try {
        // 0. Authenticate User
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

        const body = await request.json();

        // Input Validation with Zod
        const orderSchema = z.object({
            productId: z.number().int().positive("Product ID must be a positive integer"),
            quantity: z.number().int().min(1, "Quantity must be at least 1").max(100, "Quantity cannot exceed 100"),
            formData: z.any().optional(),
            requestId: z.string().optional(),
            expectedPrice: z.number().optional(),
        });

        const parseResult = orderSchema.safeParse(body);

        if (!parseResult.success) {
            return NextResponse.json(
                { error: "ข้อมูลไม่ถูกต้อง: " + parseResult.error.issues.map(i => i.message).join(", ") },
                { status: 400 }
            );
        }

        const { productId, quantity, formData, requestId, expectedPrice } = parseResult.data;

        // Request Deduplication - ป้องกัน double submission
        if (requestId) {
            const requestKey = `${userId}-${requestId}`;
            if (processedRequests.has(requestKey)) {
                const timestamp = processedRequests.get(requestKey)!;
                const secondsAgo = Math.floor((Date.now() - timestamp) / 1000);
                return NextResponse.json(
                    { error: `คำสั่งซื้อนี้ถูกประมวลผลไปแล้ว (${secondsAgo} วินาทีที่แล้ว)` },
                    { status: 409 }
                );
            }
            processedRequests.set(requestKey, Date.now());
        }

        // Start Transaction
        await connection.beginTransaction();

        // 1. Fetch Product (Lock for Update) - Ensure product belongs to this shop
        const [products] = await connection.query<RowDataPacket[]>(
            "SELECT * FROM products WHERE id = ? AND shop_id = ? FOR UPDATE",
            [productId, shopId]
        );

        if (products.length === 0) {
            await connection.rollback();
            return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });
        }

        let product = products[0];

        // Check if product is active
        if (product.is_active !== 1 && product.is_active !== true) {
            await connection.rollback();
            return NextResponse.json({ error: "สินค้านี้ไม่พร้อมขาย" }, { status: 400 });
        }

        // For API products with auto-pricing, fetch real-time price
        // Logic removed as API integration is deleted
        let actualPrice = Number(product.price);


        // Check for Price Mismatch if expectedPrice is provided
        if (expectedPrice !== undefined) {
            const tolerance = 0.01; // Allow small floating point differences
            if (Math.abs(actualPrice - expectedPrice) > tolerance) {
                await connection.rollback();
                return NextResponse.json(
                    { error: `ราคาสินค้ามีการเปลี่ยนแปลง (ราคาเดิม: ${expectedPrice}, ราคาใหม่: ${actualPrice}) กรุณารีเฟรชหน้าจอ` },
                    { status: 400 }
                );
            }
        }

        const totalPrice = actualPrice * quantity;

        // 2. Check User Credit (Lock for Update) - Ensure user belongs to this shop
        const [users] = await connection.query<RowDataPacket[]>(
            "SELECT credit FROM users WHERE id = ? AND shop_id = ? FOR UPDATE",
            [userId, shopId]
        );

        if (users.length === 0) {
            await connection.rollback();
            return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
        }

        const userCredit = Number(users[0].credit || 0);

        if (userCredit < totalPrice) {
            await connection.rollback();
            return NextResponse.json(
                { error: "ยอดเงินไม่เพียงพอ (Insufficient Credit)" },
                { status: 400 }
            );
        }

        let orderData = "";
        let status = 'pending';

        // 3. Handle Logic based on Type
        if (product.type === "account") {
            const accounts = product.account
                ? product.account.split("\n").filter((line: string) => line.trim() !== "")
                : [];

            if (accounts.length < quantity) {
                await connection.rollback();
                return NextResponse.json(
                    { error: "สินค้าหมด (Out of Stock)" },
                    { status: 400 }
                );
            }

            // Take the top N accounts
            const soldAccounts = accounts.slice(0, quantity);
            const remainingAccounts = accounts.slice(quantity);

            orderData = soldAccounts.join("\n");
            status = 'completed';

            // Update product stock
            await connection.query(
                "UPDATE products SET account = ? WHERE id = ? AND shop_id = ?",
                [remainingAccounts.join("\n"), productId, shopId]
            );
        } else if (product.type === "form") {
            if (!formData) {
                await connection.rollback();
                return NextResponse.json(
                    { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
                    { status: 400 }
                );
            }
            // Save form data as JSON string or formatted string
            orderData = JSON.stringify(formData);
            status = 'pending';
        }

        // 4. Deduct Credit
        await connection.query(
            "UPDATE users SET credit = credit - ? WHERE id = ? AND shop_id = ?",
            [totalPrice, userId, shopId]
        );

        // 5. Create Order and get ID
        const [result] = await connection.query<ResultSetHeader>(
            "INSERT INTO orders (shop_id, user_id, product_id, price, quantity, data, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [shopId, userId, productId, actualPrice, quantity, orderData, status]
        );

        const orderId = result.insertId;

        // Commit Transaction
        await connection.commit();

        return NextResponse.json({
            success: true,
            orderId,
            message: 'สั่งซื้อสำเร็จ'
        });
    } catch (error) {
        await connection.rollback();
        console.error("Order Error:", error instanceof Error ? error.message : "Unknown error");
        return NextResponse.json(
            { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
