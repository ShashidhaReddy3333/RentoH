'use client';

import type { Route } from "next";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { routes } from "@/lib/routes";
import { focusFirstInvalidInput } from "@/lib/utils/focus-management";

interface Props {
  propertyId: string;
  landlordId: string;
  propertyTitle: string;
  userId: string;
}

export function PropertyApplicationForm({ propertyId, landlordId, propertyTitle, userId }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ monthlyIncome?: string; message?: string }>({});
  const [formData, setFormData] = useState({
    monthlyIncome: "",
    message: ""
  });
  const supabase = createSupabaseBrowserClient();
  
  if (!supabase) {
    console.error('[PropertyApplicationForm] Supabase client not available');
    return null;
  }

  const validateForm = () => {
    const newErrors: { monthlyIncome?: string; message?: string } = {};
    
    if (!formData.monthlyIncome || formData.monthlyIncome.trim() === "") {
      newErrors.monthlyIncome = "Monthly income is required";
    } else if (Number(formData.monthlyIncome) <= 0) {
      newErrors.monthlyIncome = "Monthly income must be greater than 0";
    }
    
    if (!formData.message || formData.message.trim() === "") {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      // Focus the first invalid input
      if (formRef.current) {
        setTimeout(() => {
          if (formRef.current) {
            focusFirstInvalidInput(formRef.current);
          }
        }, 100);
      }
      return;
    }
    
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("applications").insert({
        property_id: propertyId,
        landlord_id: landlordId,
        tenant_id: userId,
        monthly_income: Number.parseInt(formData.monthlyIncome, 10),
        message: formData.message,
        status: "submitted",
        submitted_at: new Date().toISOString()
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

      // Add a small delay to ensure the application is processed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use replace instead of push to prevent back navigation issues
      router.replace(routes.applications as Route);
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
      
      {isSubmitting && (
        <div className="mb-4 rounded-lg bg-blue-50 p-4 text-center">
          <p className="text-sm text-blue-700">Submitting your application...</p>
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
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
              aria-invalid={!!errors.monthlyIncome}
              aria-describedby={errors.monthlyIncome ? "monthlyIncome-error" : undefined}
              className={`block w-full rounded-md border px-3 py-2 pl-7 focus:outline-none focus:ring-2 ${
                errors.monthlyIncome
                  ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                  : "border-gray-300 focus:border-brand-teal focus:ring-brand-teal"
              }`}
              value={formData.monthlyIncome}
              onChange={(event) => {
                setFormData((prev) => ({ ...prev, monthlyIncome: event.target.value }));
                if (errors.monthlyIncome) {
                  setErrors((prev) => ({ ...prev, monthlyIncome: undefined }));
                }
              }}
              placeholder="5000"
              min={0}
            />
          </div>
          {errors.monthlyIncome && (
            <p id="monthlyIncome-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.monthlyIncome}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="message" className="mb-1 block text-sm font-medium text-gray-700">
            Message to landlord
          </label>
          <textarea
            id="message"
            required
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? "message-error" : undefined}
            className={`block w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 ${
              errors.message
                ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                : "border-gray-300 focus:border-brand-teal focus:ring-brand-teal"
            }`}
            rows={4}
            value={formData.message}
            onChange={(event) => {
              setFormData((prev) => ({ ...prev, message: event.target.value }));
              if (errors.message) {
                setErrors((prev) => ({ ...prev, message: undefined }));
              }
            }}
            placeholder="Introduce yourself and explain why you would be a great tenant..."
          />
          {errors.message && (
            <p id="message-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.message}
            </p>
          )}
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
