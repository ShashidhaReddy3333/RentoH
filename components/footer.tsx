import Link from "next/link";
import type { Route } from "next";

type FooterLink = { label: string; href: Route };

const footLinks = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
] as const satisfies readonly FooterLink[];

export default function Footer() {
  return (
    <footer className="border-t border-brand-dark/10 bg-brand-bg">
      <div className="mx-auto flex max-w-container flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-text-muted sm:px-6 lg:px-8 md:flex-row">
        <nav className="flex flex-wrap items-center gap-5">
          {footLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-brand-teal"
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
