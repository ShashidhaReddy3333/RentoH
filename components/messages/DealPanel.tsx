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
    "inline-flex items-center justify-center rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
  secondary:
    "inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
} satisfies Record<Required<ApplicantAction>["variant"], string>;

export default function DealPanel({ listing, applicant, labels, notes }: DealPanelProps) {
  return (
    <aside className="hidden xl:block xl:w-[340px] xl:shrink-0 xl:border-l xl:border-slate-200 xl:bg-white xl:p-4">
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
      <section className="rounded-2xl border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-900">Listing</h3>
        <p className="mt-2 text-sm text-slate-500">No listing details available for this conversation.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 p-4" aria-labelledby="deal-panel-listing">
      <h3 id="deal-panel-listing" className="text-sm font-semibold text-slate-900">
        Listing
      </h3>
      <div className="mt-3">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100">
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
        <div className="mt-3 space-y-2 text-sm text-slate-600">
          {listing.title ? <p className="text-base font-semibold text-slate-900">{listing.title}</p> : null}
          {listing.price ? (
            <p>
              <span className="font-semibold text-slate-900">Price:</span> {listing.price}
            </p>
          ) : null}
          {listing.availableFrom ? (
            <p>
              <span className="font-semibold text-slate-900">Available:</span> {listing.availableFrom}
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
    <section className="rounded-2xl border border-slate-200 p-4" aria-labelledby="deal-panel-applicant">
      <h3 id="deal-panel-applicant" className="text-sm font-semibold text-slate-900">
        Applicant
      </h3>
      <div className="mt-3 flex items-start gap-3">
        <Avatar initials={applicant?.initials ?? applicant?.name ?? "?"} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{applicant?.name ?? "Unknown applicant"}</p>
          <p className="text-xs text-slate-500">
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
    <section className="rounded-2xl border border-slate-200 p-4" aria-labelledby="deal-panel-labels">
      <h3 id="deal-panel-labels" className="text-sm font-semibold text-slate-900">
        Labels
      </h3>
      {labels && labels.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {labels.map((label) => (
            <Chip key={label}>{label}</Chip>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">Add labels to keep this deal organized.</p>
      )}
    </section>
  );
}

function NotesCard({ notes }: { notes?: string }) {
  return (
    <section className="rounded-2xl border border-slate-200 p-4" aria-labelledby="deal-panel-notes">
      <h3 id="deal-panel-notes" className="text-sm font-semibold text-slate-900">
        Internal notes
      </h3>
      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
        {notes ? <p>{notes}</p> : <p>No notes yet. Summarize key details or next steps here.</p>}
      </div>
    </section>
  );
}
