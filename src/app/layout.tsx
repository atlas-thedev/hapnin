import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/SmoothScroll";
import { TransitionProvider } from "@/components/PageTransition";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Cursor } from "@/components/Cursor";
import { Preloader } from "@/components/Preloader";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument", display: "swap" });
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

const site = process.env.NEXT_PUBLIC_SITE_URL || "https://ss.playnative.fun";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: "Hapnin — every school event, one place", template: "%s · Hapnin" },
  description: "Announcements, calendars, countdowns, tickets and live updates for every school event. Built for students, teachers and parents.",
  openGraph: { type: "website", siteName: "Hapnin", images: ["/img/cricket.webp"] },
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = { themeColor: "#0f0e0c" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${instrument.variable} ${geist.variable} ${geistMono.variable}`}>
      <body>
        <SmoothScroll>
          <TransitionProvider>
            <Preloader />
            <Nav />
            <main className="min-h-screen">{children}</main>
            <Footer />
            <Cursor />
          </TransitionProvider>
        </SmoothScroll>
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
