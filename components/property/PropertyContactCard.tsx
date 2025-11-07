'use client';

import Link from "next/link";
import type { Route } from "next";
import { CalendarIcon, EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useTransition, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import { buttonStyles } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createThreadForProperty } from "@/app/(app)/messages/create-thread-action";
import { initialTourRequestState, requestTourAction, type TourRequestState } from "@/app/(app)/tours/actions";

type PropertyContactCardProps = {
  propertyId: string;
  propertyTitle: string;
  isAuthenticated: boolean;
  propertySlug?: string;
  landlordId?: string;
};

export function PropertyContactCard({
  propertyId,
  propertyTitle,
  isAuthenticated,
  propertySlug,
  landlordId
}: PropertyContactCardProps) {
  const [isMessagePending, startMessageTransition] = useTransition();
  const [isTourPending, startTourTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showTourForm, setShowTourForm] = useState(false);
  const [tourFormValues, setTourFormValues] = useState({ date: "", time: "", notes: "" });
  const [tourState, setTourState] = useState<TourRequestState>(initialTourRequestState);
  const applyTarget = propertySlug ?? propertyId;
  const applyHref = `/property/${applyTarget}/apply` as Route;
  
  // Handle missing landlordId gracefully
  const hasLandlord = Boolean(landlordId);

  const handleMessageClick = () => {
    if (!isAuthenticated) {
      const detailTarget = propertySlug ?? propertyId;
      window.location.href = `/auth/sign-in?next=/property/${detailTarget}`;
      return;
    }

    setError(null);
    startMessageTransition(async () => {
      const result = await createThreadForProperty(propertyId);
      if (result?.error) {
        setError(result.error);
      }
      // On success, the server action redirects to messages
    });
  };

  const handleRequestTourClick = () => {
    if (!isAuthenticated) {
      const detailTarget = propertySlug ?? propertyId;
      window.location.href = `/auth/sign-in?next=/property/${detailTarget}`;
      return;
    }
    if (!landlordId) {
      setTourState({ status: "error", message: "Tour scheduling is unavailable for this listing." });
      return;
    }
    setTourState(initialTourRequestState);
    setShowTourForm((prev) => !prev);
  };

  const handleTourFieldChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setTourFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleTourSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!landlordId) {
      setTourState({ status: "error", message: "Tour scheduling is unavailable for this listing." });
      return;
    }

    const payload = new FormData();
    payload.set("propertyId", propertyId);
    payload.set("landlordId", landlordId);
    payload.set("date", tourFormValues.date);
    payload.set("time", tourFormValues.time);
    payload.set("notes", tourFormValues.notes);
    if (propertySlug) {
      payload.set("propertySlug", propertySlug);
    }

    startTourTransition(async () => {
      const result = await requestTourAction(initialTourRequestState, payload);
      setTourState(result);
      if (result.status === "success") {
        setTourFormValues({ date: "", time: "", notes: "" });
        setShowTourForm(false);
      }
    });
  };

  const tourFeedback =
    tourState.status === "success"
      ? "Tour request sent. We'll email you once the landlord responds."
      : tourState.status === "error" || tourState.status === "validation-error"
        ? tourState.message
        : null;

  const requestTourCtaLabel = !isAuthenticated ? "Sign in to request tour" : "Request a tour";

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

      {!hasLandlord && (
        <div
          role="alert"
          className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-700"
        >
          This property is currently being configured. Contact our support team for assistance.
        </div>
      )}

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
          disabled={isMessagePending || !hasLandlord}
          className={clsx(buttonStyles({ variant: "primary", size: "md" }), "w-full justify-center")}
          aria-label={isAuthenticated ? "Compose a message about this property" : "Sign in to contact the landlord"}
        >
          <EnvelopeIcon className="h-5 w-5" aria-hidden="true" />
          {isMessagePending ? "Opening conversation..." : isAuthenticated ? "Message landlord" : "Sign in to contact"}
        </button>
        <a
          href="tel:+15195557421"
          className={clsx(buttonStyles({ variant: "secondary", size: "md" }), "w-full justify-center")}
          aria-label="Call the Rento support line"
        >
          <PhoneIcon className="h-5 w-5" aria-hidden="true" />
          Call support
        </a>
        {applyTarget && hasLandlord ? (
          isAuthenticated ? (
            <Link
              href={applyHref}
              className={clsx(buttonStyles({ variant: "primary", size: "md" }), "w-full justify-center")}
            >
              Apply now
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                window.location.href = `/auth/sign-in?next=${applyHref}`;
              }}
              className={clsx(buttonStyles({ variant: "primary", size: "md" }), "w-full justify-center")}
            >
              Sign in to apply
            </button>
          )
        ) : null}
        <button
          type="button"
          onClick={handleRequestTourClick}
          className={clsx(buttonStyles({ variant: "secondary", size: "md" }), "w-full justify-center")}
          disabled={!hasLandlord || isTourPending}
        >
          <CalendarIcon className="h-5 w-5" aria-hidden="true" />
          {isTourPending ? "Requesting..." : requestTourCtaLabel}
        </button>
      </div>
      {tourFeedback ? (
        <p
          className={clsx(
            "rounded-lg px-3 py-2 text-xs",
            tourState.status === "success"
              ? "bg-brand-teal/10 text-brand-teal"
              : "bg-red-50 text-red-600"
          )}
          role="status"
        >
          {tourFeedback}
        </p>
      ) : null}
      {showTourForm ? (
        <form
          onSubmit={handleTourSubmit}
          className="space-y-4 rounded-2xl border border-brand-outline/60 bg-brand-light/40 p-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-brand-dark">
              Preferred date
              <Input
                type="date"
                name="date"
                required
                value={tourFormValues.date}
                onChange={handleTourFieldChange}
                className="mt-1"
              />
            </label>
            <label className="text-sm font-semibold text-brand-dark">
              Preferred time
              <Input
                type="time"
                name="time"
                required
                value={tourFormValues.time}
                onChange={handleTourFieldChange}
                className="mt-1"
              />
            </label>
          </div>
          <label className="text-sm font-semibold text-brand-dark">
            Notes for the landlord (optional)
            <textarea
              name="notes"
              value={tourFormValues.notes}
              onChange={handleTourFieldChange}
              rows={3}
              className="mt-1 w-full rounded-lg border border-brand-outline/60 bg-surface px-3 py-2 text-sm text-brand-dark shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40"
              placeholder="Share any scheduling constraints or questions."
            />
          </label>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setShowTourForm(false);
                setTourState(initialTourRequestState);
              }}
              className={buttonStyles({ variant: "ghost", size: "sm" })}
              disabled={isTourPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={buttonStyles({ variant: "primary", size: "sm" })}
              disabled={isTourPending}
            >
              {isTourPending ? "Sending..." : "Send request"}
            </button>
          </div>
        </form>
      ) : null}
      <p className="text-xs text-text-muted">
        Reference <span className="font-semibold text-textc">{propertyTitle}</span> when you reach out so our team can
        connect you quickly.
      </p>
    </section>
  );
}

