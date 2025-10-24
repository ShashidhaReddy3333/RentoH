import "./globals.css";

import { Inter } from "next/font/google";
import type { Metadata } from "next";

import Footer from "@/components/footer";
import Header from "@/components/header";
import { SupabaseConfigBanner } from "@/components/SupabaseConfigBanner";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Rento",
  description: "Find verified rentals, message landlords, and manage your journey with Rento."
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-brand-bg font-sans text-textc`}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 rounded-full bg-brand-blue px-4 py-2 text-white transition"
        >
          Skip to content
        </a>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main id="main" className="flex-1">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10">
              <SupabaseConfigBanner />
              {children}
            </div>
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
