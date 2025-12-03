import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { getCachedSettings } from "@/lib/settings-cache";
import { Toaster } from "@/components/ui/sonner";
import { headers } from "next/headers";

const noto_sans_thai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "700"],
  display: 'swap', // ✨ Optimize font loading
  preload: true,
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getCachedSettings(); // ✨ Use cached settings
  return {
    title: settings.site_title,
    description: settings.site_description || "ร้านค้าออนไลน์ของคุณ",
    icons: {
      icon: settings.site_icon || "/favicon.ico",
      shortcut: settings.site_icon || "/favicon.ico",
      apple: settings.site_icon || "/favicon.ico",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getCachedSettings(); // ✨ Use cached settings (no duplicate DB call!)
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isAdminPage = pathname.startsWith("/admin");

  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <style>{`
          :root {
            --primary: ${settings.primary_color};
            --secondary-accent: ${settings.secondary_color || '#8b5cf6'};
            --ring: ${settings.primary_color};
          }
          .bg-gradient-primary {
            background: linear-gradient(135deg, ${settings.primary_color} 0%, ${settings.secondary_color || '#8b5cf6'} 100%);
          }
          .hover\\:bg-gradient-primary:hover {
            background: linear-gradient(135deg, ${settings.primary_color} 0%, ${settings.secondary_color || '#8b5cf6'} 100%);
            opacity: 0.9;
          }
          .text-gradient-primary {
            background: linear-gradient(135deg, ${settings.primary_color} 0%, ${settings.secondary_color || '#8b5cf6'} 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          body {
            background-image: url('${settings.site_background}');
            background-size: cover;
            background-position: center;
            background-attachment: scroll;
            background-repeat: no-repeat;
            overflow-anchor: none;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
          }
          html {
            scroll-behavior: smooth;
          }
        `}</style>
      </head>
      <body className={noto_sans_thai.className} suppressHydrationWarning={true}>
        <Providers>
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
