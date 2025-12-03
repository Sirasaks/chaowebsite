import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { buyGafiwProduct } from "@/lib/gafiw-service";
import { z } from "zod";
import { getJwtSecret } from "@/lib/env";

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

        // 1. Fetch Product (Lock for Update)
        const [products] = await connection.query<RowDataPacket[]>(
            "SELECT * FROM products WHERE id = ? FOR UPDATE",
            [productId]
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
        let actualPrice = Number(product.price);

        if (product.type === 'api' && (product.is_auto_price === 1 || product.is_auto_price === true) && product.api_type_id) {
            try {
                const provider = product.api_provider || 'gafiw';
                let foundApiPrice = false;

                if (provider === 'gafiw') {
                    const { getGafiwProducts } = await import('@/lib/gafiw-service');
                    const gafiwProducts = await getGafiwProducts();
                    const apiProduct = gafiwProducts.find(p => p.type_id === product.api_type_id);

                    if (apiProduct && apiProduct.price !== undefined && apiProduct.price !== null) {
                        actualPrice = Number(apiProduct.price);
                        foundApiPrice = true;
                    }
                }

                if (!foundApiPrice) {
                    await connection.rollback();
                    return NextResponse.json({ error: "ไม่สามารถดึงราคาสินค้าจาก API ได้ (Product Not Found)" }, { status: 400 });
                }

            } catch (error) {
                console.error("Error fetching API price:", error);
                await connection.rollback();
                return NextResponse.json({ error: "ไม่สามารถดึงราคาสินค้าจาก API ได้ (Connection Error)" }, { status: 500 });
            }
        }


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

        // 2. Check User Credit (Lock for Update)
        const [users] = await connection.query<RowDataPacket[]>(
            "SELECT credit FROM users WHERE id = ? FOR UPDATE",
            [userId]
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
                "UPDATE products SET account = ? WHERE id = ?",
                [remainingAccounts.join("\n"), productId]
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
        } else if (product.type === "api") {
            // API type: Use pending state pattern to prevent money loss
            // We'll deduct credit and create order first, then call API outside transaction

            if (!product.api_type_id) {
                await connection.rollback();
                return NextResponse.json(
                    { error: "สินค้านี้ไม่มีข้อมูล API (กรุณาแจ้งแอดมิน)" },
                    { status: 400 }
                );
            }

            // Generate unique transaction ID for idempotency
            const apiTransactionId = `${userId}-${productId}-${Date.now()}`;

            // Set initial status as api_pending (will be updated after API call)
            status = 'api_pending';
            orderData = JSON.stringify({
                status: 'processing',
                message: 'กำลังประมวลผลคำสั่งซื้อ...'
            });

            // Store transaction ID for later verification
            const [insertResult] = await connection.query<ResultSetHeader>(
                `INSERT INTO orders 
                (user_id, product_id, price, quantity, data, status, api_transaction_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [userId, productId, actualPrice, quantity, orderData, status, apiTransactionId]
            );

            const orderId = insertResult.insertId;

            // Deduct Credit for API product
            await connection.query(
                "UPDATE users SET credit = credit - ? WHERE id = ?",
                [totalPrice, userId]
            );

            // Commit transaction BEFORE calling external API
            // This ensures credit is deducted and order is created safely
            await connection.commit();
            connection.release();

            // Now call external API outside of transaction with timeout
            try {
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('API_TIMEOUT')), 10000)
                );

                const apiPromise = buyGafiwProduct(product.api_type_id, formData?.username);

                const buyResult = await Promise.race([apiPromise, timeoutPromise]) as any;

                if (!buyResult.ok) {
                    // API failed - delete order and refund
                    await pool.query(
                        "DELETE FROM orders WHERE id = ?",
                        [orderId]
                    );

                    // Refund credit
                    await pool.query(
                        "UPDATE users SET credit = credit + ? WHERE id = ?",
                        [totalPrice, userId]
                    );

                    return NextResponse.json(
                        {
                            error: buyResult.message || "การสั่งซื้อจากผู้จัดจำหน่ายล้มเหลว (คืนเงินแล้ว)",
                            orderId
                        },
                        { status: 400 }
                    );
                }

                // API success - update order with product data
                await pool.query(
                    `UPDATE orders 
                    SET status = 'completed', 
                        data = ? 
                    WHERE id = ?`,
                    [JSON.stringify(buyResult.data), orderId]
                );

                return NextResponse.json({
                    success: true,
                    orderId,
                    message: 'สั่งซื้อสำเร็จ'
                });

            } catch (apiError: any) {
                console.error("Gafiw API Error:", apiError);

                if (apiError.message === 'API_TIMEOUT') {
                    // Timeout - order stays in api_pending state
                    await pool.query(
                        `UPDATE orders 
                        SET retry_count = retry_count + 1,
                            last_error = 'API Timeout' 
                        WHERE id = ?`,
                        [orderId]
                    );

                    return NextResponse.json(
                        {
                            success: true,
                            orderId,
                            warning: 'คำสั่งซื้อกำลังประมวลผล กรุณาตรวจสอบในประวัติการสั่งซื้อ',
                            status: 'processing'
                        },
                        { status: 202 } // Accepted
                    );
                }

                // Other API errors - delete order and refund
                await pool.query(
                    "DELETE FROM orders WHERE id = ?",
                    [orderId]
                );

                await pool.query(
                    "UPDATE users SET credit = credit + ? WHERE id = ?",
                    [totalPrice, userId]
                );

                return NextResponse.json(
                    {
                        error: "ข้อผิดพลาดจากผู้จัดจำหน่าย (คืนเงินแล้ว): " + (apiError.message || "ไม่ทราบสาเหตุ"),
                        orderId
                    },
                    { status: 500 }
                );
            }
        }

        // 4. Deduct Credit
        await connection.query(
            "UPDATE users SET credit = credit - ? WHERE id = ?",
            [totalPrice, userId]
        );

        // 5. Create Order and get ID
        const [result] = await connection.query<ResultSetHeader>(
            "INSERT INTO orders (user_id, product_id, price, quantity, data, status) VALUES (?, ?, ?, ?, ?, ?)",
            [userId, productId, actualPrice, quantity, orderData, status]
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
