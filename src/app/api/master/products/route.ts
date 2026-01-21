import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const [rows] = await pool.query<RowDataPacket[]>(
            "SELECT id, name, price, duration_days, description FROM master_products WHERE is_active = 1 ORDER BY price ASC"
        );

        return NextResponse.json(rows, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
            }
        });
    } catch (error: any) {
        console.error("Fetch Master Products Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
