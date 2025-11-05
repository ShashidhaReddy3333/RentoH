'use client';

import type { Route } from "next";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { routes } from "@/lib/routes";

interface Props {
  propertyId: string;
  landlordId: string;
  propertyTitle: string;
  userId: string;
}

export function PropertyApplicationForm({ propertyId, landlordId, propertyTitle, userId }: Props) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    monthlyIncome: "",
    message: ""
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("applications").insert({
        property_id: propertyId,
        landlord_id: landlordId,
        applicant_id: userId,
        monthly_income: Number.parseInt(formData.monthlyIncome, 10),
        message: formData.message,
        status: "submitted"
      });

      if (error) {
        throw error;
      }

      try {
        await fetch("/api/digest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: landlordId, reason: "application" })
        });
      } catch (err) {
        console.error("[applications] digest trigger failed", err);
      }

      router.push(routes.applications as Route);
    } catch (err) {
      console.error("[applications] submission error", err);
      alert("Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Apply for {propertyTitle}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="monthlyIncome" className="mb-1 block text-sm font-medium text-gray-700">
            Monthly income
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              id="monthlyIncome"
              required
              className="block w-full rounded-md border border-gray-300 px-3 py-2 pl-7 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal"
              value={formData.monthlyIncome}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, monthlyIncome: event.target.value }))
              }
              placeholder="5000"
              min={0}
            />
          </div>
        </div>

        <div>
          <label htmlFor="message" className="mb-1 block text-sm font-medium text-gray-700">
            Message to landlord
          </label>
          <textarea
            id="message"
            required
            className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal"
            rows={4}
            value={formData.message}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, message: event.target.value }))
            }
            placeholder="Introduce yourself and explain why you would be a great tenant..."
          />
        </div>

        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit application"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
