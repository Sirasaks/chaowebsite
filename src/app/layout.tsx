import type { Metadata } from "next";
import { Noto_Sans_Thai, Prompt, Kanit, IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { getCachedSettings } from "@/lib/settings-cache";
import { Toaster } from "@/components/ui/sonner";
import { WebVitals } from "@/components/WebVitals";
import { headers } from "next/headers";
import NextTopLoader from 'nextjs-toploader';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Initialize all fonts
const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: 'swap',
  variable: '--font-noto-sans-thai',
});

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: 'swap',
  variable: '--font-prompt',
});

const kanit = Kanit({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: 'swap',
  variable: '--font-kanit',
});

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: 'swap',
  variable: '--font-ibm-plex-sans-thai',
});

// Font mapping
const fontMap: Record<string, { variable: string; className: string }> = {
  noto_sans_thai: { variable: '--font-noto-sans-thai', className: notoSansThai.className },
  prompt: { variable: '--font-prompt', className: prompt.className },
  kanit: { variable: '--font-kanit', className: kanit.className },
  ibm_plex_sans_thai: { variable: '--font-ibm-plex-sans-thai', className: ibmPlexSansThai.className },
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getCachedSettings();
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
  const settings = await getCachedSettings();
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isAdminPage = pathname.startsWith("/admin");

  // Get selected font or default to Noto Sans Thai
  const selectedFont = fontMap[settings.site_font || 'noto_sans_thai'] || fontMap.noto_sans_thai;

  return (
    <html lang="th" suppressHydrationWarning data-scroll-behavior="smooth">
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
          .group:hover .text-gradient-primary-hoverable {
            background: none !important;
            -webkit-background-clip: unset !important;
            -webkit-text-fill-color: white !important;
            background-clip: unset !important;
          }
          .text-gradient-primary-hoverable {
            background: linear-gradient(135deg, ${settings.primary_color} 0%, ${settings.secondary_color || '#8b5cf6'} 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            transition: all 0.3s ease;
          }
          body {
            background-image: ${settings.site_background ? `url('${settings.site_background}')` : 'none'};
            background-size: cover;
            background-position: center;
            background-attachment: scroll;
            background-repeat: no-repeat;
            overflow-anchor: none;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
          }

        `}</style>
      </head>
      <body className={selectedFont.className} suppressHydrationWarning={true}>
        <NextTopLoader
          color={settings.primary_color || "#2299DD"}
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow={`0 0 10px ${settings.primary_color || "#2299DD"},0 0 5px ${settings.primary_color || "#2299DD"}`}
        />
        <Providers>
          <WebVitals />
          {children}
          <Toaster position="top-right" />
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

