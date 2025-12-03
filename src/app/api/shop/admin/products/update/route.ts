import { NextResponse } from "next/server";
import pool from "@/lib/db";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";
import { RowDataPacket } from "mysql2";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    // Auth Check
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const decoded = jwt.verify(token, getJwtSecret()) as { userId: number };
        const [users] = await pool.query<RowDataPacket[]>(
            "SELECT role FROM users WHERE id = ?",
            [decoded.userId]
        );
        if (users.length === 0 || users[0].role !== 'owner') {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
    } catch (err) {
        return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
    }

    const connection = await pool.getConnection();
    try {

        const body = await request.json();
        const { productId, ...updates } = body;

        if (!productId) {
            return NextResponse.json(
                { error: "Product ID is required" },
                { status: 400 }
            );
        }

        const fields: string[] = [];
        const params: any[] = [];

        // Handle specific fields
        if (updates.category_id !== undefined) {
            fields.push("category_id = ?");
            params.push(updates.category_id);
        }

        if (updates.is_auto_price !== undefined) {
            fields.push("is_auto_price = ?");
            params.push(updates.is_auto_price);
        }

        if (updates.price !== undefined) {
            fields.push("price = ?");
            params.push(parseFloat(updates.price));
        }

        if (fields.length === 0) {
            return NextResponse.json(
                { message: "No updates provided" },
                { status: 200 }
            );
        }

        params.push(productId);

        const query = `UPDATE products SET ${fields.join(", ")} WHERE id = ?`;

        await connection.query(query, params);

        return NextResponse.json({ message: "Product updated successfully" });

    } catch (error) {
        console.error("Admin Product Update Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
