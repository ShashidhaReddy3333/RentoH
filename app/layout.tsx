import "./globals.css";

import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import nextDynamic from 'next/dynamic';

import { SupabaseConfigBanner } from "@/components/SupabaseConfigBanner";
import { env } from '@/lib/env';

const Footer = nextDynamic(() => import('@/components/footer'), {
  ssr: true,
  loading: () => (
    <div className="h-32 animate-pulse bg-surface" role="progressbar" aria-label="Loading footer" />
  )
});

const inter = Inter({ subsets: ["latin"], display: "swap" });

const siteUrl = (env.NEXT_PUBLIC_SITE_URL ?? "https://rento.example").replace(/\/$/, "");

export const metadata = {
  title: "Rento",
  description: "Find verified rentals, message landlords, and manage your journey with Rento.",
  alternates: { canonical: siteUrl }
};

export const dynamic = "force-dynamic";
export default function RootLayout({ children }: { children: any }) {
  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Rento",
    url: siteUrl
  };

  return (
    <html lang="en">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }} />
      </head>
      <body className={`${inter.className} bg-brand-bg font-sans text-textc`}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 rounded-full bg-brand-blue px-4 py-2 text-white transition"
        >
          Skip to content
        </a>
        <main id="main" className="flex-1">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10">
            <SupabaseConfigBanner />
            {children}
          </div>
        </main>
        <Footer />
      </body>
    </html>
  );
}
