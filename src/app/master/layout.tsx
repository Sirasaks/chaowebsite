import { MasterNavbar } from "@/components/master/Navbar";
import { MasterFooter } from "@/components/master/Footer";

import { MasterAuthProvider } from "@/context/AuthContext"

export default function MasterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <MasterAuthProvider>
            <div className="flex min-h-screen flex-col bg-slate-50">
                <MasterNavbar />
                <main className="flex-1">{children}</main>

            </div>
        </MasterAuthProvider>
    );
}
