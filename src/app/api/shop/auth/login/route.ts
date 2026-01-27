import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-logger";
import { getJwtSecret } from "@/lib/env";

const loginSchema = z.object({
  login: z.string(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const ip = (req.headers.get("x-forwarded-for") ?? "127.0.0.1").split(",")[0];

  try {
    const { success } = rateLimit(`shop-login:${ip}`, { limit: 5, windowMs: 60000 });

    if (!success) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', { ip, endpoint: '/api/shop/auth/login' });
      return NextResponse.json({ error: "ทำรายการเร็วเกินไป กรุณารอสักครู่" }, { status: 429 });
    }

    const body = await req.json();
    const { login, password } = loginSchema.parse(body);

    // 1. Get Shop ID from Subdomain
    const subdomain = req.headers.get("x-shop-subdomain");
    if (!subdomain) {
      return NextResponse.json({ error: "ไม่พบข้อมูลร้านค้า (Subdomain missing)" }, { status: 400 });
    }

    const [shopRows] = await pool.query(
      "SELECT id FROM shops WHERE subdomain = ?",
      [subdomain]
    );

    if ((shopRows as any[]).length === 0) {
      return NextResponse.json({ error: "ไม่พบร้านค้านี้ในระบบ" }, { status: 404 });
    }

    const shopId = (shopRows as any[])[0].id;

    // 2. Find User in this Shop
    const [rows] = await pool.query(
      "SELECT id, username, password, role, credit FROM users WHERE (username = ? OR email = ?) AND shop_id = ?",
      [login, login, shopId]
    );
    const user = (rows as any[])[0];

    if (!user) {
      logSecurityEvent('LOGIN_FAILED', { ip, username: login, reason: 'user_not_found', shopId });
      return NextResponse.json({ error: "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      logSecurityEvent('LOGIN_FAILED', { ip, username: login, reason: 'invalid_password', shopId });
      return NextResponse.json({ error: "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }

    // ✅ Simple: Single Token (7 days)
    const secret = getJwtSecret();
    const token = jwt.sign(
      { userId: user.id, role: user.role, tokenType: 'shop', shopId },
      secret,
      { expiresIn: "7d" }
    );

    logSecurityEvent('LOGIN_SUCCESS', { ip, userId: user.id, username: user.username, shopId });

    const res = NextResponse.json({
      message: "เข้าสู่ระบบสำเร็จ",
      user: { id: user.id, username: user.username, role: user.role, credit: user.credit },
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
    if (err.name === "ZodError") return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
