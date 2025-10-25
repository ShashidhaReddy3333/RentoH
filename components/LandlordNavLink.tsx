"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export function LandlordNavLink() {
  const [role, setRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function fetchRole() {
      const res = await fetch("/api/user-role");
      if (res.ok) {
        const data = await res.json();
        setRole(data.role);
      }
    }
    fetchRole();
  }, []);

  if (role !== "landlord" && role !== "admin") return null;
  return (
    <Link
      href={{ pathname: "/listings/new" }}
      className="rounded-full px-3 py-2 text-sm font-medium text-brand-teal transition hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg"
    >
      Manage listings
    </Link>
  );
}
