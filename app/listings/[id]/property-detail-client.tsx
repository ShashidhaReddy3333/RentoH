"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ImageCarousel from "@/components/image-carousel";
import BadgeVerified from "@/components/badge-verified";
import ChatPane, { Conversation } from "@/components/chat-pane";
import { useAppState } from "@/components/providers/app-provider";

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
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
        We couldn’t find this listing. It may have been removed or is awaiting approval.
        <div className="mt-4">
          <Link href="/browse" className="btn btn-primary">
            Back to browse
          </Link>
        </div>
      </div>
    );
  }

  const heroStats = [
    { label: "Rent", value: `$${property.rent}/mo` },
    { label: "Type", value: property.type[0].toUpperCase() + property.type.slice(1) },
    { label: "Furnishing", value: property.furnished ? "Furnished" : "Unfurnished" },
    { label: "Availability", value: property.availability === "available" ? "Available now" : "Waitlist" }
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
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
          <Link href="/browse" className="text-[var(--c-blue)] hover:underline">
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
              <h1 className="text-3xl font-semibold text-[var(--c-dark)]">{property.title}</h1>
              {property.verified && <BadgeVerified />}
            </div>
            <p className="text-sm text-gray-600">
              {property.address ?? ""} {property.city}, {property.postalCode}
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn btn-secondary" onClick={handleContact}>
              Contact landlord
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => toggleFavorite(property.id)}
              aria-pressed={isFavorite(property.id)}
            >
              {isFavorite(property.id) ? "♥ Saved" : "♡ Save"}
            </button>
          </div>
        </div>
      </header>

      <ImageCarousel images={property.images} title={property.title} />

      <section className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="card space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {heroStats.map((stat) => (
              <div key={stat.label} className="rounded-lg bg-[var(--c-primary)]/5 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-gray-500">{stat.label}</div>
                <div className="text-lg font-semibold text-[var(--c-dark)]">{stat.value}</div>
              </div>
            ))}
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[var(--c-dark)]">Overview</h2>
            <p className="mt-2 text-sm text-gray-600">
              {property.description ||
                "The landlord has not provided details yet. Check back soon for more information."}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[var(--c-dark)]">Amenities</h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {property.amenities.map((amenity) => (
                <li
                  key={amenity}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
                >
                  {amenity}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card space-y-3">
            <h3 className="text-lg font-semibold text-[var(--c-dark)]">Landlord</h3>
            <p className="text-sm text-gray-600">{landlord?.name ?? "Rento Host"}</p>
            <button type="button" className="btn btn-primary w-full" onClick={handleContact}>
              Message landlord
            </button>
          </div>
          <div className="card space-y-2 text-sm text-gray-600">
            <p>Move-in timing: flexible</p>
            <p>Average response time: under 2 hours</p>
            <p>Neighborhood: close to transit and amenities</p>
          </div>
        </aside>
      </section>

      {showChat && conversation && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        >
          <div className="relative w-full max-w-4xl">
            <button
              type="button"
              className="absolute -top-12 right-0 btn"
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
      )}
    </div>
  );
}
