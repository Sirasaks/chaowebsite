import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import { getJwtSecret } from "@/lib/env";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return NextResponse.json({ user: null });

    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as { userId: number; role?: string };

    const [rows] = await pool.query(
      "SELECT id, username, role, credit FROM users WHERE id = ?",
      [decoded.userId]
    );

    const user = (rows as any[])[0];

    if (!user) return NextResponse.json({ user: null });

    // Check if role has changed
    if (user.role !== decoded.role) {
      // Generate new token with updated role
      const newToken = jwt.sign(
        { userId: user.id, role: user.role },
        secret,
        { expiresIn: "7d" }
      );

      // Update cookie
      cookieStore.set("token", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ user: null });
  }
}
