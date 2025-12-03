import Navbar from "@/components/shop/Navbar"
import { Footer } from "@/components/shop/Footer"
import PageTransition from "@/components/shop/PageTransition"

import { ShopAuthProvider } from "@/context/AuthContext"

export default function ShopLayout({
    children,
}: {
    children: React.ReactNode
}) {
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
