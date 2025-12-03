import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";
import { getJwtSecret } from "@/lib/env";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) return NextResponse.json({ user: null });

        const decoded = jwt.verify(token, getJwtSecret()) as { userId: number; role?: string };

        // Check if it's a Master User
        const [rows] = await pool.query(
            "SELECT id, username, role FROM master_users WHERE id = ?",
            [decoded.userId]
        );

        const user = (rows as any[])[0];

        if (!user) return NextResponse.json({ user: null });

        return NextResponse.json({
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                credit: 0 // Master users don't have credit yet
            },
        });
    } catch (err) {
        return NextResponse.json({ user: null });
    }
}
