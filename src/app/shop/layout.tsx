import Navbar from "@/components/shop/Navbar"
import { Footer } from "@/components/shop/Footer"
import PageTransition from "@/components/shop/PageTransition"

import { ShopAuthProvider } from "@/context/AuthContext"
import { getShopIdFromContext } from "@/lib/shop-helper"
import { redirect } from "next/navigation"

export default async function ShopLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Validate Shop Existence
    const shopId = await getShopIdFromContext();
    if (!shopId) {
        // Redirect to Master Homepage if shop not found
        // We need to redirect to the root domain to exit the invalid subdomain
        const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
        const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'chaoweb.site';
        const port = process.env.NODE_ENV === 'development' ? ':3000' : '';

        // If we are in development and using localhost, we redirect to localhost:3000
        // If in production, we redirect to https://chaoweb.site

        if (process.env.NODE_ENV === 'development') {
            redirect(`http://localhost:3000`);
        } else {
            redirect(`https://${rootDomain}`);
        }
    }

    return (
        <ShopAuthProvider>
            <div className="flex min-h-screen flex-col">
                <Navbar />
                <PageTransition>{children}</PageTransition>
                <Footer />
            </div>
        </ShopAuthProvider>
    )
}
