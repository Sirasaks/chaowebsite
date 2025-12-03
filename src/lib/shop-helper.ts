import pool from "@/lib/db";
import { headers } from "next/headers";

// Cache for subdomain -> shop_id (Simple in-memory cache, could be Redis in production)
// Note: In serverless/edge, this cache might reset frequently.
const shopIdCache: Record<string, number> = {};

export async function getShopIdFromSubdomain(subdomain: string): Promise<number | null> {
    if (!subdomain) return null;

    // Check cache first
    if (shopIdCache[subdomain]) {
        return shopIdCache[subdomain];
    }

    try {
        const [rows] = await pool.query(
            "SELECT id FROM shops WHERE subdomain = ?",
            [subdomain]
        );

        const shop = (rows as any[])[0];
        if (shop) {
            shopIdCache[subdomain] = shop.id;
            return shop.id;
        }
        return null;
    } catch (error) {
        console.error("Error fetching shop ID:", error);
        return null;
    }
}

export async function getShopIdFromRequest(request: Request): Promise<number | null> {
    const subdomain = request.headers.get("x-shop-subdomain");
    if (!subdomain) return null;
    return getShopIdFromSubdomain(subdomain);
}

export async function getShopIdFromContext(): Promise<number | null> {
    const headersList = await headers();
    // In middleware we set x-shop-subdomain, but for Server Components 
    // we might need to rely on the host header if middleware didn't set it (it should have).
    // Wait, middleware sets request headers, which are passed to Server Components?
    // Actually, middleware rewrite preserves headers.

    // Let's try to get x-shop-subdomain first
    let subdomain = headersList.get("x-shop-subdomain");

    if (!subdomain) {
        // Fallback: Parse host
        const host = headersList.get("host") || "";
        const isLocal = host.includes("localhost");
        const rootDomain = "chaoweb.site";

        if (isLocal) {
            const parts = host.split(":")[0].split(".");
            if (parts.length > 1 && parts[0] !== "www") {
                subdomain = parts[0];
            }
        } else if (host.endsWith(`.${rootDomain}`)) {
            subdomain = host.replace(`.${rootDomain}`, "");
        }
    }

    if (!subdomain || subdomain === "www") return null;

    return getShopIdFromSubdomain(subdomain);
}
