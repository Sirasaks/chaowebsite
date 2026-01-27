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

        let decoded: { userId: number; role?: string };
        try {
            decoded = jwt.verify(token, getJwtSecret()) as { userId: number; role?: string };
        } catch (jwtError) {
            // Token expired or invalid
            return NextResponse.json({ user: null });
        }

        // Check if it's a Master User
        const [rows] = await pool.query(
            "SELECT id, username, role, credit FROM master_users WHERE id = ?",
            [decoded.userId]
        );

        const user = (rows as any[])[0];

        if (!user) return NextResponse.json({ user: null });

        return NextResponse.json({
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                credit: user.credit
            },
        });
    } catch (err) {
        return NextResponse.json({ user: null });
    }
}
