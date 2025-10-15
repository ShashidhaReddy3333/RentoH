import "./globals.css";
import type { Metadata } from "next";
import Header from "@/components/header";
import Footer from "@/components/footer";
import StickyMobileNav from "@/components/sticky-mobile-nav";
import { AppProvider } from "@/components/providers/app-provider";

export const metadata: Metadata = {
  title: "Rento Bridge",
  description: "Find or list rentals with confidence on Rento Bridge."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--c-bg)] text-[var(--c-dark)]">
        <AppProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 pb-24 md:pb-0">
              <div className="container py-10">{children}</div>
            </main>
            <Footer />
            <StickyMobileNav />
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
