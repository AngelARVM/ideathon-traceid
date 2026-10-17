import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { DemoBanner } from "@/components/DemoBanner";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

// Inter para el texto y Plus Jakarta Sans para los títulos, como codigo-ui.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const title = "SubMarket · Subproductos agroindustriales NEA";
const description =
  "SubMarket conecta a quienes generan subproductos agroindustriales en Corrientes, Misiones y Chaco con compradores cercanos.";

export const metadata: Metadata = {
  title: {
    default: title,
    template: "%s · SubMarket",
  },
  description,
  openGraph: {
    title,
    description,
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#176B4D",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="flex min-h-dvh flex-col bg-page font-sans text-gray-800 antialiased selection:bg-brand-200">
        <DemoBanner />
        <SiteHeader />
        <main className="flex-1 w-full">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
