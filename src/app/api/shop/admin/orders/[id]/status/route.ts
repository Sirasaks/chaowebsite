import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { RowDataPacket } from "mysql2";
import { getJwtSecret } from "@/lib/env";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status, note } = body;

        if (!['completed', 'cancelled'].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }

        // Auth Check
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
            const decoded = jwt.verify(token, getJwtSecret()) as { role?: string };
            if (decoded.role !== 'owner') {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        } catch (err) {
            return NextResponse.json({ error: "Invalid Token" }, { status: 401 });
        }

        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // 1. Get current order status and details
            const [orders] = await connection.query<RowDataPacket[]>(
                "SELECT * FROM orders WHERE id = ? FOR UPDATE",
                [id]
            );

            if (orders.length === 0) {
                await connection.rollback();
                return NextResponse.json({ error: "Order not found" }, { status: 404 });
            }

            const order = orders[0];

            if (order.status !== 'pending') {
                await connection.rollback();
                return NextResponse.json({ error: "Order is not pending" }, { status: 400 });
            }

            // 2. Update Status
            await connection.query(
                "UPDATE orders SET status = ?, note = ? WHERE id = ?",
                [status, note || null, id]
            );

            // 3. If Cancelled, Refund Credit
            if (status === 'cancelled') {
                await connection.query(
                    "UPDATE users SET credit = credit + ? WHERE id = ?",
                    [order.price * order.quantity, order.user_id]
                );
            }

            await connection.commit();
            return NextResponse.json({ success: true });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Error updating order status:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
