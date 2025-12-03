import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getJwtSecret, getAllowedOrigins } from '@/lib/env';
// import { rateLimit } from '@/lib/rate-limit';

export async function middleware(req: NextRequest) {
    const url = req.nextUrl;
    const hostname = req.headers.get("host") || "";
    const pathname = url.pathname;

    console.log("Middleware Debug:", {
        hostHeader: req.headers.get("host"),
        nextUrlHostname: req.nextUrl.hostname,
        pathname
    });

    // Define allowed domains (Adjust for production)
    const rootDomain = "chaoweb.site"; // Change this to your real domain
    const isLocal = hostname.includes("localhost");

    // Extract subdomain
    // localhost:3000 -> subdomain = null (treat as master)
    // shop1.chaoweb.site -> subdomain = shop1
    // www.chaoweb.site -> subdomain = www (treat as master)

    let subdomain = null;
    if (isLocal) {
        // Handle localhost subdomains: shop1.localhost:3000
        // Host header includes port, e.g., "shop1.localhost:3000"
        const hostWithoutPort = hostname.split(":")[0];
        const parts = hostWithoutPort.split(".");
        if (parts.length > 1 && parts[0] !== "www") {
            subdomain = parts[0];
        }
    } else if (hostname.endsWith(`.${rootDomain}`)) {
        subdomain = hostname.replace(`.${rootDomain}`, "");
    }

    console.log("Extracted Subdomain:", subdomain);

    // Determine if it's a Shop request or Master request
    const isShop = subdomain && subdomain !== "www";

    // API Handling (No rewrite for API, but inject shop_id header if needed)
    if (pathname.startsWith("/api")) {
        const requestHeaders = new Headers(req.headers);
        if (subdomain) {
            requestHeaders.set('x-shop-subdomain', subdomain);
        }
        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
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
         * 1. /_next (Next.js internals)
         * 2. /_static (inside /public)
         * 3. all root files inside /public (e.g. /favicon.ico)
         */
        "/((?!_next/|_static/|[\\w-]+\\.\\w+).*)",
    ],
};
