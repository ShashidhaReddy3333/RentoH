'use client';

import { EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useTransition, useState } from 'react';

import { buttonStyles } from "@/components/ui/button";
import { createThreadForProperty } from "@/app/(app)/messages/create-thread-action";

type PropertyContactCardProps = {
  propertyId: string;
  propertyTitle: string;
  isAuthenticated: boolean;
  propertySlug?: string;
};

export function PropertyContactCard({
  propertyId,
  propertyTitle,
  isAuthenticated,
  propertySlug
}: PropertyContactCardProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleMessageClick = () => {
    if (!isAuthenticated) {
      const detailTarget = propertySlug ?? propertyId;
      window.location.href = `/auth/sign-in?next=/property/${detailTarget}`;
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await createThreadForProperty(propertyId);
      if (result?.error) {
        setError(result.error);
      }
      // On success, the server action redirects to messages
    });
  };

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

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600"
        >
          {error}
        </div>
      )}

      <div className="space-y-3">
        <button
          type="button"
          onClick={handleMessageClick}
          disabled={isPending}
          className={clsx(buttonStyles({ variant: "primary", size: "md" }), "w-full justify-center")}
          aria-label={isAuthenticated ? "Compose a message about this property" : "Sign in to contact the landlord"}
        >
          <EnvelopeIcon className="h-5 w-5" aria-hidden="true" />
          {isPending ? "Opening conversation..." : isAuthenticated ? "Message landlord" : "Sign in to contact"}
        </button>
        <a
          href="tel:+15195557421"
          className={clsx(buttonStyles({ variant: "secondary", size: "md" }), "w-full justify-center")}
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

