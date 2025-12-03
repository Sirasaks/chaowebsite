import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getJwtSecret, getAllowedOrigins } from '@/lib/env';
// import { rateLimit } from '@/lib/rate-limit';

export async function middleware(req: NextRequest) {
    const url = req.nextUrl;
    const hostname = req.headers.get("host") || "";
    const pathname = url.pathname;

    // Define allowed domains (Adjust for production)
    const rootDomain = "chaoweb.site"; // Change this to your real domain
    const isLocal = hostname.includes("localhost");

    // Extract subdomain
    // localhost:3000 -> subdomain = null (treat as master)
    // shop1.chaoweb.site -> subdomain = shop1
    // www.chaoweb.site -> subdomain = www (treat as master)

    let subdomain = null;
    if (!isLocal && hostname.endsWith(`.${rootDomain}`)) {
        subdomain = hostname.replace(`.${rootDomain}`, "");
    }

    // Determine if it's a Shop request or Master request
    const isShop = subdomain && subdomain !== "www";

    // API Handling (No rewrite for API, but inject shop_id header if needed)
    if (pathname.startsWith("/api")) {
        // Here you could look up shop_id from subdomain and set header
        // For now, we just let it pass
        return NextResponse.next();
    }

    // Auth Protection for Topup Sub-pages
    if (pathname.startsWith("/topup/") && (pathname.includes("/slip") || pathname.includes("/angpao"))) {
        const token = req.cookies.get("token");
        if (!token) {
            const loginUrl = new URL("/login", req.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    // Rewrite Logic
    if (isShop) {
        // Rewrite to /shop/...
        // e.g. shop1.com/login -> /shop/login
        url.pathname = `/shop${pathname}`;
        return NextResponse.rewrite(url);
    } else {
        // Rewrite to /master/...
        // e.g. www.chaoweb.site/ -> /master
        url.pathname = `/master${pathname}`;
        return NextResponse.rewrite(url);
    }
}

export const config = {
    matcher: [
        /*
         * Match all paths except for:
         * 1. /api routes
         * 2. /_next (Next.js internals)
         * 3. /_static (inside /public)
         * 4. all root files inside /public (e.g. /favicon.ico)
         */
        "/((?!api/|_next/|_static/|[\\w-]+\\.\\w+).*)",
    ],
};
