import { MasterNavbar } from "@/components/master/Navbar";
import { MasterAuthProvider } from "@/context/AuthContext"
import { IBM_Plex_Sans_Thai } from "next/font/google";

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
    subsets: ["thai", "latin"],
    weight: ["400", "500", "600", "700"],
    display: 'swap',
    variable: '--font-ibm-plex-sans-thai',
});

export default function MasterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <MasterAuthProvider>
            <div className={`flex min-h-screen flex-col bg-slate-50 ${ibmPlexSansThai.className} ${ibmPlexSansThai.variable}`}>
                <MasterNavbar />
                <main className="flex-1 font-sans">{children}</main>
            </div>
        </MasterAuthProvider>
    );
}
