import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { EnvironmentBanner } from "@/components/EnvironmentBanner";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const description =
  "TraceID: registro individual de ganado bovino para productores del nordeste argentino.";

export const metadata: Metadata = {
  title: {
    default: "TraceID · Trazabilidad Bovina NEA",
    template: "%s · TraceID",
  },
  description,
  openGraph: {
    title: "TraceID · Trazabilidad Bovina NEA",
    description,
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2F6B3A",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${jakarta.variable} ${plexMono.variable}`}>
      <body className="min-h-dvh flex flex-col bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100 font-sans antialiased selection:bg-campo-200 dark:selection:bg-campo-900/60">
        <EnvironmentBanner />
        <SiteHeader />
        <main className="flex-1 w-full">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
