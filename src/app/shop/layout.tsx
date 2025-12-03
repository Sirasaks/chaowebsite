import Navbar from "@/components/shop/Navbar"
import { Footer } from "@/components/shop/Footer"
import PageTransition from "@/components/shop/PageTransition"

export default function ShopLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />
            <PageTransition>{children}</PageTransition>
            <Footer />
        </div>
    )
}
