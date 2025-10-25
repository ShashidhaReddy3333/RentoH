"use client";

import { useEffect, useState } from "react";
import Toggle from "@/components/form/toggle";

type Prefs = {
  emailNotifications: {
    newMessages: boolean;
    applications: boolean;
    tours: boolean;
  };
  smsNotifications: {
    newMessages: boolean;
    applications: boolean;
    tours: boolean;
  };
};

export default function NotificationsClient() {  const [prefs, setPrefs] = useState<Prefs | null>(null);
  // const [saving, setSaving] = useState(false); // 'saving' is assigned a value but never used.

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/user-preferences');
        if (res.ok) {
          const data = await res.json();
          setPrefs(data);
        }
      } catch (e) {
        console.error('Failed to load preferences', e);
      }
    })();
  }, []);

  if (!prefs) return <div>Loading preferences…</div>;

  const save = async (partial: Partial<Prefs>) => {
    // setSaving(true); // 'saving' is assigned a value but never used.
    try {
      const body = { ...prefs, ...partial };
      await fetch('/api/user-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      setPrefs(body as Prefs);
    } catch (e) {
      console.error('Failed to save preferences', e);
    } finally {
      // setSaving(false); // 'saving' is assigned a value but never used.
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-brand-dark">Email notifications</h2>
        <div className="mt-4 flex flex-col gap-3">
          <Toggle
            id="email-new-messages"
            checked={prefs.emailNotifications.newMessages}
            onChange={(v) => save({ emailNotifications: { ...prefs.emailNotifications, newMessages: v } })}
            label="New messages"
          />
          <Toggle
            id="email-applications"
            checked={prefs.emailNotifications.applications}
            onChange={(v) => save({ emailNotifications: { ...prefs.emailNotifications, applications: v } })}
            label="Applications"
          />
          <Toggle
            id="email-tours"
            checked={prefs.emailNotifications.tours}
            onChange={(v) => save({ emailNotifications: { ...prefs.emailNotifications, tours: v } })}
            label="Tour updates"
          />
        </div>
      </section>

      <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-soft">
        <h2 className="text-lg font-semibold text-brand-dark">SMS notifications</h2>
        <div className="mt-4 flex flex-col gap-3">
          <Toggle
            id="sms-new-messages"
            checked={prefs.smsNotifications.newMessages}
            onChange={(v) => save({ smsNotifications: { ...prefs.smsNotifications, newMessages: v } })}
            label="New messages"
          />
          <Toggle
            id="sms-applications"
            checked={prefs.smsNotifications.applications}
            onChange={(v) => save({ smsNotifications: { ...prefs.smsNotifications, applications: v } })}
            label="Applications"
          />
          <Toggle
            id="sms-tours"
            checked={prefs.smsNotifications.tours}
            onChange={(v) => save({ smsNotifications: { ...prefs.smsNotifications, tours: v } })}
            label="Tour updates"
          />
        </div>
      </section>

      <div>
        <em className="text-sm text-muted">Preferences saved to your account; digests will honor these settings.</em>
      </div>
    </div>
  );
}
