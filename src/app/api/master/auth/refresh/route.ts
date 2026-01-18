import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { serialize } from "cookie";
import { refreshTokens, getAccessTokenCookieOptions, getRefreshTokenCookieOptions } from "@/lib/token-service";
import { logSecurityEvent } from "@/lib/security-logger";

export async function POST(request: Request) {
    const ip = (request.headers.get("x-forwarded-for") ?? "127.0.0.1").split(",")[0];

    try {
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get("refresh_token")?.value;

        if (!refreshToken) {
            return NextResponse.json({ error: "No refresh token" }, { status: 401 });
        }

        // Refresh tokens (with rotation)
        const newTokens = await refreshTokens(refreshToken, "master");

        if (!newTokens) {
            logSecurityEvent('TOKEN_EXPIRED', { ip, tokenType: 'master' });
            return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
        }

        logSecurityEvent('TOKEN_REFRESHED', { ip, tokenType: 'master' });

        const res = NextResponse.json({ success: true });
        res.headers.set("Set-Cookie", serialize("token", newTokens.accessToken, getAccessTokenCookieOptions()));
        res.headers.append("Set-Cookie", serialize("refresh_token", newTokens.refreshToken, getRefreshTokenCookieOptions()));

        return res;

    } catch (error) {
        console.error("Master Token Refresh Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
