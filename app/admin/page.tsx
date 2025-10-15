"use client";

import { useMemo, useState } from "react";
import StatsCards from "@/components/stats-cards";
import NotificationsPanel from "@/app/notifications/panel";
import { useAppState } from "@/components/providers/app-provider";

const tabs = ["Users", "Listings", "Verifications", "Reports"] as const;

export default function AdminDashboardPage() {
  const { users, properties, messages } = useAppState();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Users");

  const stats = useMemo(
    () => [
      { title: "Total users", value: users.length },
      { title: "Total listings", value: properties.length },
      { title: "Reports", value: 3, subtext: "Awaiting review" },
      {
        title: "Verifications pending",
        value: users.filter((user) => user.role === "landlord" && !user.verified).length
      }
    ],
    [users, properties]
  );

  const tabContent = {
    Users: (
      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
            <div className="flex items-center justify-between">
              <span>{user.name}</span>
              <span className="text-xs text-gray-500">{user.role}</span>
            </div>
            <div className="text-xs text-gray-400">{user.email}</div>
          </div>
        ))}
      </div>
    ),
    Listings: (
      <div className="space-y-3">
        {properties.map((property) => (
          <div key={property.id} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
            <div className="flex items-center justify-between">
              <span>{property.title}</span>
              <span className="text-xs text-gray-500">${property.rent}/mo</span>
            </div>
            <div className="text-xs text-gray-400">
              {property.city} - {property.type}
            </div>
          </div>
        ))}
      </div>
    ),
    Verifications: (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-600">
        Visit the verification queue to review pending landlords.
      </div>
    ),
    Reports: (
      <div className="space-y-3 text-sm text-gray-600">
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
          <div className="font-medium text-[var(--c-dark)]">Listing flagged: Sunny Apartment</div>
          <p className="text-xs text-gray-500">Reason: Photos look outdated.</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
          <div className="font-medium text-[var(--c-dark)]">User report: Tina Evans</div>
          <p className="text-xs text-gray-500">Requested identity re-verification.</p>
        </div>
      </div>
    )
  } as const;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--c-dark)]">Admin dashboard</h1>
          <p className="text-sm text-gray-600">
            Monitor platform health, moderate content, and review verifications.
          </p>
        </div>
      </header>

      <StatsCards stats={stats} />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab
                    ? "bg-[var(--c-primary)] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="space-y-3">{tabContent[activeTab]}</div>
        </section>

        <aside className="space-y-4">
          <NotificationsPanel />
          <div className="card space-y-2 text-sm text-gray-600">
            <h2 className="text-lg font-semibold text-[var(--c-dark)]">Activity log</h2>
            <ul className="space-y-1 text-xs text-gray-500">
              {messages.slice(-3).map((message) => (
                <li key={message.id}>
                  New message regarding {message.propertyId} - {message.body.slice(0, 40)}...
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
