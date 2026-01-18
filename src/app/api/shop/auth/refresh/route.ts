import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshTokens, getAccessTokenCookieOptions, getRefreshTokenCookieOptions } from "@/lib/token-service";
import { logSecurityEvent, getClientInfo } from "@/lib/security-logger";
import { serialize } from "cookie";
import { getShopIdFromRequest } from "@/lib/shop-helper";

/**
 * POST /api/shop/auth/refresh
 * Refresh access token using refresh token
 */
export async function POST(request: Request) {
    try {
        const shopId = await getShopIdFromRequest(request);
        const cookieStore = await cookies();
        const refreshToken = cookieStore.get("refresh_token")?.value;

        if (!refreshToken) {
            return NextResponse.json(
                { error: "No refresh token provided" },
                { status: 401 }
            );
        }

        // Attempt to refresh tokens
        const newTokens = await refreshTokens(refreshToken, 'shop', shopId ?? undefined);

        if (!newTokens) {
            const { ip } = getClientInfo(request);
            logSecurityEvent('TOKEN_EXPIRED', { ip, endpoint: '/api/auth/refresh' });

            // Clear cookies
            const response = NextResponse.json(
                { error: "Invalid or expired refresh token" },
                { status: 401 }
            );
            response.headers.append("Set-Cookie", serialize("token", "", { maxAge: 0, path: "/" }));
            response.headers.append("Set-Cookie", serialize("refresh_token", "", { maxAge: 0, path: "/" }));
            return response;
        }

        // Log successful refresh
        logSecurityEvent('TOKEN_REFRESHED', {
            ip: getClientInfo(request).ip,
            shopId: shopId ?? undefined
        });

        // Set new cookies
        const response = NextResponse.json({ success: true });

        response.headers.append(
            "Set-Cookie",
            serialize("token", newTokens.accessToken, getAccessTokenCookieOptions())
        );
        response.headers.append(
            "Set-Cookie",
            serialize("refresh_token", newTokens.refreshToken, getRefreshTokenCookieOptions())
        );

        return response;
    } catch (error) {
        console.error("Token refresh error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
