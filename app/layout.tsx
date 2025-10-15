import "./globals.css";

import type { Metadata } from "next";

import ThemeProvider from "@/app/theme-provider";
import Footer from "@/components/footer";
import Header from "@/components/header";
import { AppProvider } from "@/components/providers/app-provider";
import StickyMobileNav from "@/components/sticky-mobile-nav";

export const metadata: Metadata = {
  title: "Rento Bridge",
  description: "Find or list rentals with confidence on Rento Bridge.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-brand-bg font-sans text-brand-dark">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 rounded-full bg-brand-blue px-4 py-2 text-white transition"
        >
          Skip to content
        </a>
        <ThemeProvider>
          <AppProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main id="main" className="flex-1 pb-section">
                {children}
              </main>
              <Footer />
              <StickyMobileNav />
            </div>
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
