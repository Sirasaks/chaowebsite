import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";
import { z } from "zod";
import { getJwtSecret } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";

const loginSchema = z.object({
    login: z.string(),
    password: z.string().min(1),
});

export async function POST(req: Request) {
    try {
        // Rate limiting: 10 attempts per minute
        const ip = (req.headers.get("x-forwarded-for") ?? "127.0.0.1").split(",")[0];
        const { success } = rateLimit(`master-login:${ip}`, { limit: 10, windowMs: 60000 });

        if (!success) {
            return NextResponse.json({ error: "ทำรายการเร็วเกินไป กรุณารอ 1 นาที" }, { status: 429 });
        }

        const body = await req.json();
        const { login, password } = loginSchema.parse(body);

        const [rows] = await pool.query(
            "SELECT id, username, password, role FROM master_users WHERE username = ? OR email = ?",
            [login, login]
        );
        const user = (rows as any[])[0];
        if (!user) return NextResponse.json({ error: "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return NextResponse.json({ error: "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });

        // Token with type scope to separate master/shop
        const token = jwt.sign({ userId: user.id, role: user.role, tokenType: 'master' }, getJwtSecret(), { expiresIn: "7d" });

        const cookie = serialize("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 7 * 24 * 60 * 60,
        });

        const res = NextResponse.json({
            message: "เข้าสู่ระบบสำเร็จ",
            user: { id: user.id, username: user.username, role: user.role },
        });
        res.headers.set("Set-Cookie", cookie);
        return res;

    } catch (err: any) {
        console.error(err);
        if (err.name === "ZodError") return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
        return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
    }
}
