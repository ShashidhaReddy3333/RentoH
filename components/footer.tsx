import Link from "next/link";
import type { Route } from "next";

type FooterLink = { label: string; href: Route };

const footLinks = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" }
] as const satisfies readonly FooterLink[];

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-black/10 bg-surface text-textc/80 dark:border-white/10">
      <div className="container flex flex-col items-center justify-between gap-4 py-8 text-sm text-textc/70 md:flex-row">
        <nav className="flex flex-wrap items-center gap-4">
          {footLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-brand.primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <p>Copyright {new Date().getFullYear()} Rento Bridge. All rights reserved.</p>
      </div>
    </footer>
  );
}
