import { getShopIdFromContext } from "@/lib/shop-helper";
import { redirect } from "next/navigation";
import ShopLayoutClient from "@/components/shop/ShopLayoutClient";
import { headers } from "next/headers";
import pool from "@/lib/db";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
    const shopId = await getShopIdFromContext();
    if (!shopId) return {};

    const [settingsRows] = await pool.query(
        "SELECT site_title FROM site_settings WHERE shop_id = ?",
        [shopId]
    );
    const settings = (settingsRows as any[])[0] || {};
    const siteTitle = settings.site_title || 'Web Shop';

    return {
        title: {
            template: `%s | ${siteTitle}`,
            default: siteTitle,
        },
        icons: {
            icon: '/favicon.ico', // Default icon, can be dynamic too
        }
    };
}

export default async function ShopLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // 1. Check if the shop exists
    const shopId = await getShopIdFromContext();

    // 2. If no shop found (and we are in the /shop route), redirect to Master
    if (!shopId) {
        const headersList = await headers();
        const host = headersList.get("host") || "";

        // Determine protocol and root domain
        // Ideally this should match your middleware logic or env vars
        if (host.includes("localhost")) {
            redirect("http://localhost:3000");
        } else {
            // Production fallback
            redirect("https://chaoweb.site");
        }
    }

    // 3. Fetch Shop Settings
    const [settingsRows] = await pool.query(
        "SELECT site_title, site_logo, contact_link, announcement_text FROM site_settings WHERE shop_id = ?",
        [shopId]
    );
    const settings = (settingsRows as any[])[0] || {};

    // 4. If valid, render the client structure
    return (
        <ShopLayoutClient settings={settings}>
            {children}
        </ShopLayoutClient>
    )
}

