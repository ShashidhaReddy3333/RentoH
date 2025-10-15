import './globals.css';

import type { Metadata } from 'next';

import ThemeProvider from '@/app/theme-provider';
import Footer from '@/components/footer';
import Header from '@/components/header';
import { AppProvider } from '@/components/providers/app-provider';
import StickyMobileNav from '@/components/sticky-mobile-nav';

export const metadata: Metadata = {
  title: 'Rento Bridge',
  description: 'Find or list rentals with confidence on Rento Bridge.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[var(--bg)] text-textc transition-colors">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 rounded-xl bg-brand.blue px-3 py-2 text-white"
        >
          Skip to content
        </a>
        <style jsx global>{`
          :root {
            --surface: 245 245 245;
            --surface-muted: 235 235 235;
            --text: 33 33 33;
            --text-muted: 90 90 90;
            --bg: #F5F5F5;
          }
          .dark {
            --surface: 28 28 28;
            --surface-muted: 38 38 38;
            --text: 245 245 245;
            --text-muted: 200 200 200;
            --bg: #121212;
          }
        `}</style>
        <ThemeProvider>
          <AppProvider>
            <div className="flex min-h-screen flex-col bg-surface text-textc">
              <Header />
              <main id="main" className="flex-1 pb-24 md:pb-0">
                <div className="container py-10">{children}</div>
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
