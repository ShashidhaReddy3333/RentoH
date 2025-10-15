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
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="container py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
        <nav className="flex flex-wrap items-center gap-4">
          {footLinks.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-[var(--c-primary)]">
              {item.label}
            </Link>
          ))}
        </nav>
        <p>Copyright {new Date().getFullYear()} Rento Bridge. All rights reserved.</p>
      </div>
    </footer>
  );
}
