"use client";

import { useMemo, useState } from "react";

import NotificationsPanel from "@/app/notifications/panel";
import StatsCards from "@/components/stats-cards";
import { useAppState } from "@/components/providers/app-provider";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
          <Card key={user.id}>
            <CardContent className="text-sm text-textc/80">
              <div className="flex items-center justify-between">
                <span>{user.name}</span>
                <span className="text-xs text-textc/60">{user.role}</span>
              </div>
              <div className="text-xs text-textc/50">{user.email}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    ),
    Listings: (
      <div className="space-y-3">
        {properties.map((property) => (
          <Card key={property.id}>
            <CardContent className="text-sm text-textc/80">
              <div className="flex items-center justify-between">
                <span>{property.title}</span>
                <span className="text-xs text-textc/60">${property.rent}/mo</span>
              </div>
              <div className="text-xs text-textc/60">
                {property.city} - {property.type}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    ),
    Verifications: (
      <Card className="border-2 border-dashed border-black/10 text-center text-sm text-textc/70 dark:border-white/10">
        <CardContent>
          Visit the verification queue to review pending landlords.
        </CardContent>
      </Card>
    ),
    Reports: (
      <div className="space-y-3 text-sm text-textc/70">
        <Card>
          <CardContent>
            <div className="font-medium text-textc">Listing flagged: Sunny Apartment</div>
            <p className="text-xs text-textc/60">Reason: Photos look outdated.</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="font-medium text-textc">User report: Tina Evans</div>
            <p className="text-xs text-textc/60">Requested identity re-verification.</p>
          </CardContent>
        </Card>
      </div>
    )
  } as const;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-textc">Admin dashboard</h1>
          <p className="text-sm text-textc/70">
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
                className={`${buttonStyles({
                  variant: activeTab === tab ? "primary" : "ghost",
                  size: "sm"
                })} rounded-full`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="space-y-3">{tabContent[activeTab]}</div>
        </section>

        <aside className="space-y-4">
          <NotificationsPanel />
          <Card className="text-sm text-textc/70">
            <CardContent className="space-y-2">
              <h2 className="text-lg font-semibold text-textc">Activity log</h2>
              <ul className="space-y-1 text-xs text-textc/60">
                {messages.slice(-3).map((message) => (
                  <li key={message.id}>
                    New message regarding {message.propertyId} - {message.body.slice(0, 40)}...
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
