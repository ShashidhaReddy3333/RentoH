import Link from "next/link";
import { EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

import { buttonStyles } from "@/components/ui/button";

type PropertyContactCardProps = {
  propertyId: string;
  propertyTitle: string;
  isAuthenticated: boolean;
};

export function PropertyContactCard({
  propertyId,
  propertyTitle,
  isAuthenticated
}: PropertyContactCardProps) {
  const contactHref = isAuthenticated
    ? { pathname: "/messages", query: { compose: `property-${propertyId}` } }
    : { pathname: "/auth/sign-in", query: { next: `/property/${propertyId}` } };

  return (
    <section
      aria-labelledby="contact-heading"
      className="space-y-5 rounded-3xl border border-black/5 bg-white p-6 shadow-soft"
    >
      <div className="space-y-1">
        <h2 id="contact-heading" className="text-xl font-semibold text-brand-dark">
          Ready to move forward?
        </h2>
        <p className="text-sm text-text-muted">
          Message the landlord to ask questions, request a tour, or start an application.
        </p>
      </div>
      <div className="space-y-3">
        <Link
          href={contactHref}
          className={clsx(buttonStyles({ variant: "primary", size: "md" }), "w-full justify-center")}
          prefetch
          aria-label={isAuthenticated ? "Compose a message about this property" : "Sign in to contact the landlord"}
        >
          <EnvelopeIcon className="h-5 w-5" aria-hidden="true" />
          {isAuthenticated ? "Message landlord" : "Sign in to contact"}
        </Link>
        <a
          href="tel:+15195557421"
          className={clsx(buttonStyles({ variant: "outline", size: "md" }), "w-full justify-center")}
          aria-label="Call the Rento support line"
        >
          <PhoneIcon className="h-5 w-5" aria-hidden="true" />
          Call support
        </a>
      </div>
      <p className="text-xs text-text-muted">
        Reference <span className="font-semibold text-textc">{propertyTitle}</span> when you reach out so our team can
        connect you quickly.
      </p>
    </section>
  );
}

