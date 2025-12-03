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
        const { productIds, updates } = body;

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return NextResponse.json({ error: "Product IDs are required" }, { status: 400 });
        }

        if (!updates || Object.keys(updates).length === 0) {
            return NextResponse.json({ error: "Updates are required" }, { status: 400 });
        }

        const updateFields: string[] = [];
        const params: any[] = [];

        if (updates.is_auto_price !== undefined) {
            updateFields.push("is_auto_price = ?");
            params.push(updates.is_auto_price);
        }

        // Add other fields here if needed in the future

        if (updateFields.length === 0) {
            return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
        }

        const query = `UPDATE products SET ${updateFields.join(", ")} WHERE id IN (?)`;
        params.push(productIds);

        await connection.query(query, params);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Bulk Update Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}
