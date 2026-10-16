import type { Metadata } from "next";
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { AppShell } from "@/components/AppShell";
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
  "Trazabilidad individual de ganado bovino anclada en blockchain Stellar para productores del nordeste argentino.";

export const metadata: Metadata = {
  title: {
    default: "TraceID - Trazabilidad Bovina NEA (Stellar)",
    template: "%s · TraceID",
  },
  description,
  openGraph: {
    title: "TraceID - Trazabilidad Bovina NEA",
    description,
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${jakarta.variable} ${plexMono.variable}`}>
      <body className="bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100 font-sans antialiased selection:bg-emerald-200 dark:selection:bg-emerald-900/60">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
