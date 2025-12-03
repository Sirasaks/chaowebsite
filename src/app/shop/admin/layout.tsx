import { AdminSidebar } from "@/components/shop/admin-sidebar";
import { AdminHeader } from "@/components/shop/admin-header";
import PageTransition from "@/components/shop/PageTransition";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
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
