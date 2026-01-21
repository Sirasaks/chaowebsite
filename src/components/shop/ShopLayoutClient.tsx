"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/shop/Navbar"
import { Footer } from "@/components/shop/Footer"
import PageTransition from "@/components/shop/PageTransition"
import { ShopAuthProvider } from "@/context/AuthContext"

export default function ShopLayoutClient({
    children,
    settings
}: {
    children: React.ReactNode;
    settings?: any;
}) {
    const pathname = usePathname();
    const isAdminPage = pathname?.startsWith("/admin");

    return (
        <ShopAuthProvider>
            <div className="flex min-h-screen flex-col">
                {!isAdminPage && <Navbar logo={settings?.site_logo} title={settings?.site_title} />}
                <main
                    id="main-content"
                    className="flex-1"
                    style={settings?.site_background ? {
                        backgroundImage: `url("${settings.site_background}")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        backgroundAttachment: 'fixed'
                    } : undefined}
                >
                    {isAdminPage ? children : <PageTransition>{children}</PageTransition>}
                </main>
                {!isAdminPage && <Footer title={settings?.site_title} />}
            </div>
        </ShopAuthProvider>
    )
}
