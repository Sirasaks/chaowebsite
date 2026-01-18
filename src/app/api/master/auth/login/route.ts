import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";
import { serialize } from "cookie";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { generateTokenPair, getAccessTokenCookieOptions, getRefreshTokenCookieOptions } from "@/lib/token-service";
import { logSecurityEvent } from "@/lib/security-logger";

const loginSchema = z.object({
    login: z.string(),
    password: z.string().min(1),
});

export async function POST(req: Request) {
    const ip = (req.headers.get("x-forwarded-for") ?? "127.0.0.1").split(",")[0];

    try {
        // Rate limiting: 5 attempts per minute
        const { success } = rateLimit(`master-login:${ip}`, { limit: 5, windowMs: 60000 });

        if (!success) {
            logSecurityEvent('RATE_LIMIT_EXCEEDED', { ip, endpoint: '/api/master/auth/login' });
            return NextResponse.json({ error: "ทำรายการเร็วเกินไป กรุณารอ 1 นาที" }, { status: 429 });
        }

        const body = await req.json();
        const { login, password } = loginSchema.parse(body);

        const [rows] = await pool.query(
            "SELECT id, username, password, role, credit FROM master_users WHERE username = ? OR email = ?",
            [login, login]
        );
        const user = (rows as any[])[0];

        if (!user) {
            logSecurityEvent('LOGIN_FAILED', { ip, username: login, reason: 'user_not_found' });
            return NextResponse.json({ error: "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            logSecurityEvent('LOGIN_FAILED', { ip, username: login, reason: 'invalid_password' });
            return NextResponse.json({ error: "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
        }

        // ✅ Token Rotation: Access Token (15m) + Refresh Token (7d)
        const { accessToken, refreshToken } = await generateTokenPair(
            user.id,
            user.role,
            "master"
        );

        logSecurityEvent('LOGIN_SUCCESS', { ip, userId: user.id, username: user.username });

        const res = NextResponse.json({
            message: "เข้าสู่ระบบสำเร็จ",
            user: { id: user.id, username: user.username, role: user.role, credit: user.credit },
        });

        res.headers.set("Set-Cookie", serialize("token", accessToken, getAccessTokenCookieOptions()));
        res.headers.append("Set-Cookie", serialize("refresh_token", refreshToken, getRefreshTokenCookieOptions()));
        return res;

    } catch (err: any) {
        console.error(err);
        if (err.name === "ZodError") return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
        return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
    }
}
