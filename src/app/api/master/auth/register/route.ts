import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import axios from "axios";
import { logSecurityEvent } from "@/lib/security-logger";
import { getJwtSecret } from "@/lib/env";

// ✅ Password Policy: 6 ตัวอักษรขึ้นไป
const registerSchema = z.object({
    username: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
    captchaToken: z.string().optional(),
});

async function verifyTurnstile(token: string | undefined) {
    if (!token) return false;

    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
        console.warn("TURNSTILE_SECRET_KEY is not set, skipping verification");
        return true; // Allow if config is missing (dev mode fallback)
    }

    try {
        const response = await axios.post(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            new URLSearchParams({
                secret: secretKey,
                response: token,
            }),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
        );
        return response.data.success;
    } catch (error) {
        console.error("Turnstile verification failed:", error);
        return false;
    }
}

export async function POST(req: Request) {
    try {
        // Rate limiting: 5 registrations per minute per IP
        const ip = (req.headers.get("x-forwarded-for") ?? "127.0.0.1").split(",")[0];
        const { success } = rateLimit(`master-register:${ip}`, { limit: 5, windowMs: 60000 });

        if (!success) {
            return NextResponse.json({ error: "ทำรายการเร็วเกินไป กรุณารอ 1 นาที" }, { status: 429 });
        }

        const body = await req.json();
        const { username, email, password, captchaToken } = registerSchema.parse(body);

        // Verify Turnstile
        const isCaptchaValid = await verifyTurnstile(captchaToken);
        if (!isCaptchaValid) {
            return NextResponse.json({ error: "การยืนยันตัวตนล้มเหลว (Turnstile Failed)" }, { status: 400 });
        }

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

        // 3. ✅ Simple: Single Token (7 days)
        const secret = getJwtSecret();
        const token = jwt.sign(
            { userId, role: "user", tokenType: 'master' },
            secret,
            { expiresIn: "7d" }
        );

        logSecurityEvent('REGISTER_SUCCESS', { ip, userId, username });

        const res = NextResponse.json({
            message: "สมัครสมาชิกสำเร็จ",
            user: { id: userId, username, role: "user" },
        });

        res.headers.set("Set-Cookie", serialize("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 7 * 24 * 60 * 60, // 7 days
        }));

        return res;

    } catch (err: any) {
        console.error(err);
        if (err.name === "ZodError") {
            return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
        }
        return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
    }
}
