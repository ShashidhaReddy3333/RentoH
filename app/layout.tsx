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
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const theme = savedTheme || (prefersDark ? 'dark' : 'light');
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `
          }}
        />
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
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand-teal focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-teal focus:ring-offset-2"
          >
            Skip to main content
          </a>
          <Header />
          <main id="main-content" className="flex-1">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 pb-20 sm:gap-8 sm:px-6 sm:py-10 md:pb-10">
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
