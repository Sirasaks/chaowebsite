"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/shop/Navbar"
import { Footer } from "@/components/shop/Footer"
import PageTransition from "@/components/shop/PageTransition"
import { ShopAuthProvider } from "@/context/AuthContext"

export default function ShopLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname();
    const isAdminPage = pathname?.startsWith("/admin");

    return (
        <ShopAuthProvider>
            <div className="flex min-h-screen flex-col">
                {!isAdminPage && <Navbar />}
                {isAdminPage ? children : <PageTransition>{children}</PageTransition>}
                {!isAdminPage && <Footer />}
            </div>
        </ShopAuthProvider>
    )
}
