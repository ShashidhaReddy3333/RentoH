"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import BadgeVerified from "@/components/badge-verified";
import ImageCarousel from "@/components/image-carousel";
import ChatPane from "@/components/chat-pane";
import type { Conversation } from "@/components/chat-pane";
import { useAppState } from "@/components/providers/app-provider";
import { buttonStyles } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Card, CardContent } from "@/components/ui/card";

const CURRENT_TENANT_ID = "u1";

type PropertyDetailClientProps = {
  id: string;
};

export default function PropertyDetailClient({ id }: PropertyDetailClientProps) {
  const { getProperty, users, messages, sendMessage, toggleFavorite, isFavorite } = useAppState();
  const [showChat, setShowChat] = useState(false);

  const property = getProperty(id);

  const landlord = useMemo(
    () => (property ? users.find((user) => user.id === property.landlordId) : undefined),
    [property, users]
  );

  const conversation = useMemo<Conversation | null>(() => {
    if (!property) return null;
    const propertyMessages = messages
      .filter((message) => message.propertyId === property.id)
      .map((message) => ({
        id: message.id,
        body: message.body,
        senderId: message.senderId,
        createdAt: message.createdAt
      }));
    return {
      id: property.id,
      title: property.title,
      otherUserId: property.landlordId,
      otherUserName: landlord?.name ?? "Landlord",
      messages: propertyMessages
    };
  }, [landlord?.name, messages, property]);

  if (!property) {
    return (
      <Card className="border-2 border-dashed border-black/10 text-center text-textc/70 dark:border-white/10">
        <CardContent className="space-y-4">
          <p>
            We couldn&apos;t find this listing. It may have been removed or is awaiting approval.
          </p>
          <Link href="/browse" className={buttonStyles({ variant: "primary" })}>
            Back to browse
          </Link>
        </CardContent>
      </Card>
    );
  }

  const heroStats = [
    { label: "Rent", value: `$${property.rent}/mo` },
    { label: "Type", value: property.type.charAt(0).toUpperCase() + property.type.slice(1) },
    { label: "Furnishing", value: property.furnished ? "Furnished" : "Unfurnished" },
    {
      label: "Availability",
      value: property.availability === "available" ? "Available now" : "Waitlist"
    }
  ];

  const handleContact = () => setShowChat(true);

  const handleSendMessage = (body: string) => {
    sendMessage({
      propertyId: property.id,
      senderId: CURRENT_TENANT_ID,
      recipientId: property.landlordId,
      body
    });
  };

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-sm text-textc/60">
          <Link href="/browse" className="text-brand.blue hover:text-brand.primary hover:underline">
            Browse
          </Link>
          <span>/</span>
          <span>{property.city}</span>
          <span>/</span>
          <span>{property.title}</span>
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-semibold text-textc">{property.title}</h1>
              {property.verified ? <BadgeVerified /> : null}
            </div>
            <p className="text-sm text-textc/70">
              {property.address ?? ""} {property.city}, {property.postalCode}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className={buttonStyles({ variant: "primary" })}
              onClick={handleContact}
            >
              Contact landlord
            </button>
            <button
              type="button"
              className={`${buttonStyles({ variant: "outline" })} gap-2`}
              onClick={() => toggleFavorite(property.id)}
              aria-pressed={isFavorite(property.id)}
            >
              <Icon
                name="heart"
                variant={isFavorite(property.id) ? "solid" : "outline"}
                className={`h-5 w-5 ${isFavorite(property.id) ? "text-brand-teal" : "text-brand-dark/60"}`}
              />
              <span>{isFavorite(property.id) ? "Saved" : "Save"}</span>
            </button>
          </div>
        </div>
      </header>

      <ImageCarousel images={property.images} title={property.title} />

      <section className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <Card className="space-y-6">
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {heroStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-brand.primary/20 bg-brand.primary/5 px-4 py-3 text-textc"
                >
                  <div className="text-xs uppercase tracking-wide text-textc/60">{stat.label}</div>
                  <div className="text-lg font-semibold text-textc">{stat.value}</div>
                </div>
              ))}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-textc">Overview</h2>
              <p className="mt-2 text-sm text-textc/70">
                {property.description ||
                  "The landlord has not provided details yet. Check back soon for more information."}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-textc">Amenities</h3>
              <ul className="mt-3 grid gap-2 text-sm text-textc/70 sm:grid-cols-2">
                {property.amenities.map((amenity) => (
                  <li
                    key={amenity}
                    className="rounded-xl border border-black/10 px-3 py-2 dark:border-white/10"
                  >
                    {amenity}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card>
            <CardContent className="space-y-3">
              <h3 className="text-lg font-semibold text-textc">Landlord</h3>
              <p className="text-sm text-textc/70">{landlord?.name ?? "Rento Host"}</p>
              <button
                type="button"
                className={`${buttonStyles({ variant: "primary" })} w-full`}
                onClick={handleContact}
              >
                Message landlord
              </button>
            </CardContent>
          </Card>
          <Card className="text-sm text-textc/70">
            <CardContent className="space-y-2">
              <p>Move-in timing: flexible</p>
              <p>Average response time: under 2 hours</p>
              <p>Neighborhood: close to transit and amenities</p>
            </CardContent>
          </Card>
        </aside>
      </section>

      {showChat && conversation ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        >
          <div className="relative w-full max-w-4xl">
            <button
              type="button"
              className={`${buttonStyles({ variant: "ghost" })} absolute -top-12 right-0`}
              onClick={() => setShowChat(false)}
            >
              Close
            </button>
            <ChatPane
              conversation={conversation}
              currentUserId={CURRENT_TENANT_ID}
              onSend={(message) => handleSendMessage(message.body)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
