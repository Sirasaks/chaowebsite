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

            // Verify this is a master token, not a shop token
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

        // 2. Parse Body
        const { productId } = await request.json();

        if (!productId) {
            return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
        }

        // 3. Get Product Details
        const [productRows] = await connection.query<RowDataPacket[]>(
            "SELECT * FROM master_products WHERE id = ? AND is_active = 1",
            [productId]
        );

        if (productRows.length === 0) {
            return NextResponse.json({ error: "ไม่พบแพ็คเกจที่เลือก" }, { status: 404 });
        }

        const product = productRows[0];
        const price = parseFloat(product.price);

        // 4. Check User Credit
        const [userRows] = await connection.query<RowDataPacket[]>(
            "SELECT credit FROM master_users WHERE id = ?",
            [userId]
        );

        if (userRows.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const currentCredit = parseFloat(userRows[0].credit);

        if (currentCredit < price) {
            return NextResponse.json({ error: "เครดิตไม่เพียงพอ กรุณาเติมเงิน" }, { status: 400 });
        }

        // 5. Process Transaction
        await connection.beginTransaction();

        // Deduct Credit
        await connection.query(
            "UPDATE master_users SET credit = credit - ? WHERE id = ?",
            [price, userId]
        );

        // Create Order
        const [orderResult] = await connection.query(
            "INSERT INTO master_orders (user_id, product_id, amount, status) VALUES (?, ?, ?, 'completed')",
            [userId, productId, price]
        );

        await connection.commit();

        return NextResponse.json({
            success: true,
            message: "สั่งซื้อสำเร็จ",
            orderId: (orderResult as any).insertId
        });

    } catch (error: any) {
        await connection.rollback();
        console.error("Order Error:", error);
        return NextResponse.json({ error: "Internal Server Error: " + error.message }, { status: 500 });
    } finally {
        connection.release();
    }
}
