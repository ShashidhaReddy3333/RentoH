import Link from "next/link";

const footerLinks = [
  { href: "/browse" as const, label: "Browse" },
  { href: "/privacy" as const, label: "Privacy" },
  { href: "/contact" as const, label: "Support" }
];

export default function Footer() {
  return (
    <footer className="border-t border-brand-outline/50 bg-brand-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 text-sm text-text-muted md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-textc/70">
          &copy; {new Date().getFullYear()} Rento. All rights reserved.
        </p>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center justify-center gap-4 md:justify-end">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={{ pathname: link.href }}
                  className="rounded-full px-3 py-2 transition hover:text-brand-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
