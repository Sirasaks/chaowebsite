import { AdminSidebar } from "@/components/shop/admin-sidebar";
import { AdminHeader } from "@/components/shop/admin-header";
import PageTransition from "@/components/shop/PageTransition";
import { getShopIdFromContext } from "@/lib/shop-helper";
import { checkShopAdmin } from "@/lib/auth-server";
import { redirect } from "next/navigation";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const shopId = await getShopIdFromContext();

    // If shop not found, layout.tsx parent handles it, but good to be safe
    if (!shopId) return null; // or redirect

    const isAdmin = await checkShopAdmin(shopId);

    if (!isAdmin) {
        redirect("/login");
    }

    return (
        <div className="flex min-h-screen bg-slate-50/50">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block fixed inset-y-0 left-0 z-50">
                <AdminSidebar />
            </div>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col lg:pl-72 transition-all duration-300">
                <AdminHeader />
                <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
                    <div className="max-w-7xl mx-auto">
                        <PageTransition>
                            {children}
                        </PageTransition>
                    </div>
                </main>
            </div>
        </div>
    );
}
