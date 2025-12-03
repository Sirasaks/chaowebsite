import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";
import { z } from "zod";
import { getJwtSecret } from "@/lib/env";

const registerSchema = z.object({
    username: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(8),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { username, email, password } = registerSchema.parse(body);

        // 1. Check if Master User exists
        const [existingUser] = await pool.query(
            "SELECT id FROM master_users WHERE username = ? OR email = ?",
            [username, email]
        );
        if ((existingUser as any[]).length > 0) {
            return NextResponse.json({ error: "Username หรือ Email ถูกใช้แล้ว" }, { status: 400 });
        }

        // 2. Create Master User
        const hashedPassword = await bcrypt.hash(password, 10);
        const [userResult] = await pool.query(
            "INSERT INTO master_users (username, email, password, role) VALUES (?, ?, ?, ?)",
            [username, email, hashedPassword, "user"]
        );
        const userId = (userResult as any).insertId;

        // 3. Generate Token
        const token = jwt.sign(
            { userId: userId, role: "user" },
            getJwtSecret(),
            { expiresIn: "7d" }
        );

        const cookie = serialize("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 7 * 24 * 60 * 60,
        });

        const res = NextResponse.json({
            message: "สมัครสมาชิกสำเร็จ",
            user: { id: userId, username, role: "user" },
        });
        res.headers.set("Set-Cookie", cookie);
        return res;

    } catch (err: any) {
        console.error(err);
        if (err.name === "ZodError") {
            return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
        }
        return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
    }
}
