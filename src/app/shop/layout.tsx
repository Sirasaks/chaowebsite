import { getShopIdFromContext } from "@/lib/shop-helper";
import { redirect } from "next/navigation";
import ShopLayoutClient from "@/components/shop/ShopLayoutClient";
import { headers } from "next/headers";

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

    // 3. If valid, render the client structure
    return (
        <ShopLayoutClient>
            {children}
        </ShopLayoutClient>
    )
}

