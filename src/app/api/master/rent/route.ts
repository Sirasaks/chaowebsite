import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { RowDataPacket } from "mysql2";
import { getJwtSecret } from "@/lib/env";

export async function POST(request: Request) {
    const connection = await pool.getConnection();
    try {
        // 1. Authenticate Master User
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
        }

        let masterUserId: number;
        try {
            const decoded = jwt.verify(token, getJwtSecret()) as { userId: number };
            masterUserId = decoded.userId;
        } catch (err) {
            return NextResponse.json({ error: "Token ไม่ถูกต้อง" }, { status: 401 });
        }

        // 2. Parse Body
        const body = await request.json();
        const { shopName, subdomain, username, password, operationType, packagePrice } = body;

        if (!shopName || !subdomain || !username || !password || !packagePrice) {
            return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
        }

        // 3. Check Credit
        const [userRows] = await connection.query<RowDataPacket[]>(
            "SELECT credit FROM master_users WHERE id = ?",
            [masterUserId]
        );

        if (userRows.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const currentCredit = parseFloat(userRows[0].credit);
        const price = parseFloat(packagePrice);

        if (currentCredit < price) {
            return NextResponse.json({ error: "เครดิตไม่เพียงพอ" }, { status: 400 });
        }

        // 4. Validate Subdomain (Check if exists)
        if (operationType === "new") {
            const [existingShop] = await connection.query<RowDataPacket[]>(
                "SELECT id FROM shops WHERE subdomain = ?",
                [subdomain]
            );
            if (existingShop.length > 0) {
                return NextResponse.json({ error: "ชื่อเว็บไซต์นี้ถูกใช้งานแล้ว" }, { status: 400 });
            }
        } else {
            // Renew logic (Check if shop exists and belongs to user)
            // For now, simple implementation focusing on "New"
            const [existingShop] = await connection.query<RowDataPacket[]>(
                "SELECT id FROM shops WHERE subdomain = ? AND owner_id = ?",
                [subdomain, masterUserId]
            );
            if (existingShop.length === 0) {
                return NextResponse.json({ error: "ไม่พบเว็บไซต์ที่ต้องการต่ออายุ หรือคุณไม่ใช่เจ้าของ" }, { status: 404 });
            }
        }

        // 5. Process Transaction
        await connection.beginTransaction();

        // Deduct Credit
        await connection.query(
            "UPDATE master_users SET credit = credit - ? WHERE id = ?",
            [price, masterUserId]
        );

        let shopId: number;

        if (operationType === "new") {
            // Create Shop
            const [shopResult] = await connection.query(
                "INSERT INTO shops (subdomain, name, owner_id, expire_date) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))",
                [subdomain, shopName, masterUserId]
            );
            shopId = (shopResult as any).insertId;

            // Create Shop Admin User
            const hashedPassword = await bcrypt.hash(password, 10);
            await connection.query(
                "INSERT INTO users (shop_id, username, email, password, role) VALUES (?, ?, ?, ?, 'owner')",
                [shopId, username, `${username}@${subdomain}.com`, hashedPassword] // Dummy email
            );

            // Initialize Shop Settings (Optional)
            await connection.query(
                "INSERT INTO site_settings (shop_id, site_title) VALUES (?, ?)",
                [shopId, shopName]
            );

        } else {
            // Renew: Extend expire_date
            const [shopResult] = await connection.query<RowDataPacket[]>(
                "SELECT id FROM shops WHERE subdomain = ?",
                [subdomain]
            );
            shopId = shopResult[0].id;

            await connection.query(
                "UPDATE shops SET expire_date = DATE_ADD(expire_date, INTERVAL 30 DAY) WHERE id = ?",
                [shopId]
            );
        }

        // Create Master Order Record
        // Assuming product_id 1 is standard package for now, or we can pass it
        await connection.query(
            "INSERT INTO master_orders (user_id, product_id, amount, status) VALUES (?, ?, ?, 'completed')",
            [masterUserId, 1, price] // 1 = Starter/Standard (Hardcoded for now as we use dynamic price)
        );

        await connection.commit();

        return NextResponse.json({
            success: true,
            message: "ดำเนินการสำเร็จ",
            shopId: shopId
        });

    } catch (error: any) {
        await connection.rollback();
        console.error("Rent Error:", error);
        return NextResponse.json({ error: "Internal Server Error: " + error.message }, { status: 500 });
    } finally {
        connection.release();
    }
}
