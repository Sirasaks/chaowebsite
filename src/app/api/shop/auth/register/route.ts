import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";
import { z } from "zod";
import { getJwtSecret } from "@/lib/env";
import axios from "axios";
import { getShopIdFromRequest } from "@/lib/shop-helper";
import { rateLimit } from "@/lib/rate-limit";
import { logSecurityEvent, logRateLimitExceeded } from "@/lib/security-logger";

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
    const shopId = await getShopIdFromRequest(req);
    if (!shopId) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    // Rate limiting: 5 registrations per minute per IP per shop
    const ip = (req.headers.get("x-forwarded-for") ?? "127.0.0.1").split(",")[0];
    const { success } = rateLimit(`shop-register:${shopId}:${ip}`, { limit: 5, windowMs: 60000 });

    if (!success) {
      logRateLimitExceeded(req, '/api/shop/auth/register', shopId);
      return NextResponse.json({ error: "ทำรายการเร็วเกินไป กรุณารอสักครู่" }, { status: 429 });
    }

    const body = await req.json();
    const { username, email, password, captchaToken } = registerSchema.parse(body);

    // Verify Turnstile
    const isCaptchaValid = await verifyTurnstile(captchaToken);
    if (!isCaptchaValid) {
      logSecurityEvent('REGISTER_FAILED', { ip, username, reason: 'captcha_failed', shopId });
      return NextResponse.json({ error: "การยืนยันตัวตนล้มเหลว (Turnstile Failed)" }, { status: 400 });
    }

    // ตรวจสอบ username/email ซ้ำ (เฉพาะในร้านนี้)
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE (username = ? OR email = ?) AND shop_id = ?",
      [username, email, shopId]
    );
    if ((existing as any[]).length > 0) {
      logSecurityEvent('REGISTER_FAILED', { ip, username, reason: 'duplicate_user', shopId });
      return NextResponse.json({ error: "Username หรือ Email ถูกใช้แล้วในร้านค้านี้" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (shop_id, username, email, password, role) VALUES (?, ?, ?, ?, ?)",
      [shopId, username, email, hashedPassword, "user"]
    );

    const userId = (result as any).insertId;

    // ✅ Simple: Single Token (7 days)
    const secret = getJwtSecret();
    const token = jwt.sign(
      { userId, role: "user", tokenType: 'shop', shopId },
      secret,
      { expiresIn: "7d" }
    );

    // Log Success
    logSecurityEvent('REGISTER_SUCCESS', { ip, userId, username, shopId });

    const res = NextResponse.json({
      message: "สมัครสมาชิกสำเร็จ",
      user: {
        id: userId,
        username,
        role: "user",
        shop_id: shopId
      },
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
