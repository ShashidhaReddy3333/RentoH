"use client";

import Avatar from "./Avatar";
import Chip from "./Chip";

type ListingInfo = {
  title?: string;
  price?: string;
  availableFrom?: string;
  tags?: string[];
  imageUrl?: string;
  linkUrl?: string;
};

type ApplicantAction = {
  label: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
};

type ApplicantInfo = {
  name?: string;
  initials?: string;
  memberSince?: string;
  actions?: ApplicantAction[];
};

type DealPanelProps = {
  listing?: ListingInfo;
  applicant?: ApplicantInfo;
  labels?: string[];
  notes?: string;
};

const actionStyles = {
  primary:
    "inline-flex items-center justify-center rounded-full bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
  secondary:
    "inline-flex items-center justify-center rounded-full border border-brand-outline/60 px-3 py-1.5 text-xs font-semibold text-neutral-600 transition hover:border-brand-primary hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
} satisfies Record<Required<ApplicantAction>["variant"], string>;

export default function DealPanel({ listing, applicant, labels, notes }: DealPanelProps) {
  return (
    <aside className="hidden xl:block xl:w-[340px] xl:shrink-0 xl:border-l xl:border-brand-outline/60 xl:bg-brand-light/60 xl:p-4">
      <div className="flex flex-col gap-4">
        <ListingCard listing={listing} />
        <ApplicantCard applicant={applicant} />
        <LabelsCard labels={labels} />
        <NotesCard notes={notes} />
      </div>
    </aside>
  );
}

function ListingCard({ listing }: { listing?: ListingInfo }) {
  if (!listing) {
    return (
      <section className="rounded-2xl border border-brand-outline/60 bg-white p-4">
        <h3 className="text-sm font-semibold text-brand-dark">Listing</h3>
        <p className="mt-2 text-sm text-neutral-500">No listing details available for this conversation.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-brand-outline/60 bg-white p-4" aria-labelledby="deal-panel-listing">
      <h3 id="deal-panel-listing" className="text-sm font-semibold text-brand-dark">
        Listing
      </h3>
      <div className="mt-3">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-brand-light">
          {listing.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.imageUrl}
              alt={listing.title ?? "Listing photo"}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-500">No photo</div>
          )}
        </div>
        <div className="mt-3 space-y-2 text-sm text-neutral-600">
          {listing.title ? <p className="text-base font-semibold text-brand-dark">{listing.title}</p> : null}
          {listing.price ? (
            <p>
              <span className="font-semibold text-brand-dark">Price:</span> {listing.price}
            </p>
          ) : null}
          {listing.availableFrom ? (
            <p>
              <span className="font-semibold text-brand-dark">Available:</span> {listing.availableFrom}
            </p>
          ) : null}
          {listing.tags && listing.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {listing.tags.map((tag) => (
                <Chip key={tag}>{tag}</Chip>
              ))}
            </div>
          ) : null}
        </div>
        <div className="mt-4 flex gap-2">
          {listing.linkUrl ? (
            <a
              href={listing.linkUrl}
              target="_blank"
              rel="noreferrer"
              className={actionStyles.primary}
              data-testid="deal-panel-view-listing"
            >
              View listing
            </a>
          ) : null}
          <button type="button" className={actionStyles.secondary}>
            Share
          </button>
        </div>
      </div>
    </section>
  );
}

function ApplicantCard({ applicant }: { applicant?: ApplicantInfo }) {
  return (
    <section className="rounded-2xl border border-brand-outline/60 bg-white p-4" aria-labelledby="deal-panel-applicant">
      <h3 id="deal-panel-applicant" className="text-sm font-semibold text-brand-dark">
        Applicant
      </h3>
      <div className="mt-3 flex items-start gap-3">
        <Avatar initials={applicant?.initials ?? applicant?.name ?? "?"} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-dark">{applicant?.name ?? "Unknown applicant"}</p>
          <p className="text-xs text-neutral-500">
            {applicant?.memberSince ? `Conversation since ${applicant.memberSince}` : "New conversation"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(applicant?.actions ?? defaultApplicantActions).map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className={actionStyles[action.variant ?? "secondary"]}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const defaultApplicantActions: ApplicantAction[] = [
  { label: "Verify", variant: "primary" },
  { label: "Request docs" },
  { label: "Start application" }
];

function LabelsCard({ labels }: { labels?: string[] }) {
  return (
    <section className="rounded-2xl border border-brand-outline/60 bg-white p-4" aria-labelledby="deal-panel-labels">
      <h3 id="deal-panel-labels" className="text-sm font-semibold text-brand-dark">
        Labels
      </h3>
      {labels && labels.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {labels.map((label) => (
            <Chip key={label}>{label}</Chip>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-neutral-500">Add labels to keep this deal organized.</p>
      )}
    </section>
  );
}

function NotesCard({ notes }: { notes?: string }) {
  return (
    <section className="rounded-2xl border border-brand-outline/60 bg-white p-4" aria-labelledby="deal-panel-notes">
      <h3 id="deal-panel-notes" className="text-sm font-semibold text-brand-dark">
        Internal notes
      </h3>
      <div className="mt-3 rounded-xl border border-brand-outline/50 bg-brand-light p-3 text-sm text-neutral-600">
        {notes ? <p>{notes}</p> : <p>No notes yet. Summarize key details or next steps here.</p>}
      </div>
    </section>
  );
}
