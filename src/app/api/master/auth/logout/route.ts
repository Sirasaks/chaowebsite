import { NextResponse } from "next/server";
import { serialize } from "cookie";

export async function POST() {
    const cookie = serialize("token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 0, // Expire immediately
    });

    const res = NextResponse.json({ message: "Logged out" });
    res.headers.set("Set-Cookie", cookie);
    return res;
}
