import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";
import { z } from "zod";
import { getJwtSecret } from "@/lib/env";
import axios from "axios";
import { getShopIdFromRequest } from "@/lib/shop-helper";

const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  captchaToken: z.string().optional(),
});

async function verifyRecaptcha(token: string | undefined) {
  if (!token) return false;

  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    console.warn("RECAPTCHA_SECRET_KEY is not set, skipping verification");
    return true; // Allow if config is missing (dev mode fallback)
  }

  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`
    );
    return response.data.success;
  } catch (error) {
    console.error("Recaptcha verification failed:", error);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const shopId = await getShopIdFromRequest(req);
    if (!shopId) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    const body = await req.json();
    const { username, email, password, captchaToken } = registerSchema.parse(body);

    // Verify Captcha
    const isCaptchaValid = await verifyRecaptcha(captchaToken);
    if (!isCaptchaValid) {
      return NextResponse.json({ error: "การยืนยันตัวตนล้มเหลว (reCAPTCHA Failed)" }, { status: 400 });
    }

    // ตรวจสอบ username/email ซ้ำ (เฉพาะในร้านนี้)
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE (username = ? OR email = ?) AND shop_id = ?",
      [username, email, shopId]
    );
    if ((existing as any[]).length > 0) {
      return NextResponse.json({ error: "Username หรือ Email ถูกใช้แล้วในร้านค้านี้" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (shop_id, username, email, password, role) VALUES (?, ?, ?, ?, ?)",
      [shopId, username, email, hashedPassword, "user"]
    );

    const token = jwt.sign(
      { userId: (result as any).insertId },
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
      user: {
        id: (result as any).insertId,
        username,
        role: "user",
        shop_id: shopId
      },
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
