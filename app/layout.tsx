import "./globals.css";

import { Inter } from "next/font/google";
import React from "react";
import nextDynamic from 'next/dynamic';

import { SupabaseConfigBanner } from "@/components/SupabaseConfigBanner";
import Header from "@/components/header";
import { env } from '@/lib/env';

const RootProviders = nextDynamic(
  () => import('@/components/providers/root-providers').then(mod => ({ default: mod.RootProviders })),
  { ssr: false }
);

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Enhanced JSON-LD for Organization
  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Rento",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description: "Find verified rentals, message landlords, and manage your rental journey with Rento.",
    sameAs: [
      "https://twitter.com/rento",
      "https://facebook.com/rento",
      "https://linkedin.com/company/rento"
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      email: "support@rento.example",
      availableLanguage: ["English"]
    }
  };

  // WebSite schema for search functionality
  const websiteLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Rento",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/browse?city={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang="en">
      <head>
        <script 
          type="application/ld+json" 
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }} 
        />
        <script 
          type="application/ld+json" 
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }} 
        />
      </head>
      <body className={`${inter.className} flex min-h-screen flex-col bg-brand-bg font-sans text-textc`}>
        <RootProviders>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 z-50 rounded bg-black px-3 py-2 text-white"
          >
            Skip to content
          </a>
          <Header />
          <main id="main" className="flex-1">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-10">
              <SupabaseConfigBanner />
              {children}
            </div>
          </main>
          <Footer />
        </RootProviders>
      </body>
    </html>
  );
}
