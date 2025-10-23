import type { ChangeEvent } from "react";

import type { Profile } from "@/lib/types";

type NotificationPrefs = Profile["notifications"];

type PreferenceTogglesProps = {
  value: NotificationPrefs;
  onChange: (value: NotificationPrefs) => void;
};

export default function PreferenceToggles({ value, onChange }: PreferenceTogglesProps) {
  const handleToggle =
    (key: keyof NotificationPrefs) => (event: ChangeEvent<HTMLInputElement>) => {
      onChange({ ...value, [key]: event.target.checked });
    };

  return (
    <div className="grid gap-3">
      <Toggle
        id="notif-matches"
        label="New matches"
        description="Send me updates when new homes meet my criteria."
        checked={value.newMatches}
        onChange={handleToggle("newMatches")}
      />
      <Toggle
        id="notif-messages"
        label="Messages"
        description="Email me when a landlord replies or requests more info."
        checked={value.messages}
        onChange={handleToggle("messages")}
      />
      <Toggle
        id="notif-apps"
        label="Application updates"
        description="Stay informed when applications are reviewed."
        checked={value.applicationUpdates}
        onChange={handleToggle("applicationUpdates")}
      />
    </div>
  );
}

function Toggle({
  id,
  label,
  description,
  checked,
  onChange
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-start justify-between gap-4 rounded-3xl border border-black/5 bg-surface px-4 py-3"
    >
      <div className="grid gap-1">
        <span className="text-sm font-semibold text-brand-dark">{label}</span>
        <span className="text-xs text-text-muted">{description}</span>
      </div>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-1 h-5 w-10 cursor-pointer appearance-none rounded-full border border-brand-teal/40 bg-brand-teal/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal focus-visible:ring-offset-2 focus-visible:ring-offset-white checked:bg-brand-teal"
        role="switch"
        aria-checked={checked}
      />
    </label>
  );
}
