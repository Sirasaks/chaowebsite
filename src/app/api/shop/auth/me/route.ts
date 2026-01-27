import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import { getJwtSecret } from "@/lib/env";
import { getShopIdFromRequest } from "@/lib/shop-helper";

export async function GET(req: Request) {
  try {
    const shopId = await getShopIdFromRequest(req);
    if (!shopId) return NextResponse.json({ user: null });

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return NextResponse.json({ user: null });

    const secret = getJwtSecret();

    let decoded: { userId: number; role?: string };
    try {
      decoded = jwt.verify(token, secret) as { userId: number; role?: string };
    } catch (jwtError: any) {
      // Token expired or invalid - return 401 to trigger refresh
      if (jwtError.name === 'TokenExpiredError') {
        return NextResponse.json({ error: "Token expired" }, { status: 401 });
      }
      // Other JWT errors (invalid signature, etc.)
      return NextResponse.json({ user: null });
    }

    // Verify user belongs to this shop
    const [rows] = await pool.query(
      "SELECT id, username, role, credit, IFNULL(agent_discount, 0) as agent_discount FROM users WHERE id = ? AND shop_id = ?",
      [decoded.userId, shopId]
    );

    const user = (rows as any[])[0];

    if (!user) return NextResponse.json({ user: null });

    // Check if role has changed
    if (user.role !== decoded.role) {
      // Generate new token with updated role
      const newToken = jwt.sign(
        { userId: user.id, role: user.role, tokenType: 'shop' },
        secret,
        { expiresIn: "15m" }
      );

      // Update cookie
      cookieStore.set("token", newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 15 * 60, // 15 minutes
      });
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ user: null });
  }
}
