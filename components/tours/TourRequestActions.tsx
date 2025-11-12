"use client";

import { useState } from "react";
import { useFormState } from "react-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { approveTourAction, declineTourAction } from "@/app/(app)/tours/actions";
import type { TourRequestState } from "@/app/(app)/tours/types";

interface TourRequestActionsProps {
  tourId: string;
  propertyTitle: string;
  tenantName: string;
  scheduledAt: string;
  notes?: string;
  status: string;
}

const initialState: TourRequestState = { status: "idle" };

export function TourRequestActions({
  tourId,
  propertyTitle,
  tenantName,
  scheduledAt,
  notes,
  status
}: TourRequestActionsProps) {
  const [approveState, approveAction] = useFormState(approveTourAction, initialState);
  const [declineState, declineAction] = useFormState(declineTourAction, initialState);
  const [responseNotes, setResponseNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  const isProcessing = false; // Form actions don't have loading state in useFormState
  const isProcessed = status !== "requested";

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-50 text-green-700 border-green-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      case "rescheduled":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "completed":
        return "bg-gray-50 text-gray-700 border-gray-200";
      default:
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
    }
  };

  if (isProcessed) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{propertyTitle}</h3>
            <p className="text-sm text-gray-600">Tour request from {tenantName}</p>
            <p className="text-sm text-gray-500">{formatDate(scheduledAt)}</p>
            {notes && (
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-medium">Notes:</span> {notes}
              </p>
            )}
          </div>
          <div className={`rounded-full px-3 py-1 text-sm font-medium border ${getStatusColor(status)}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{propertyTitle}</h3>
          <p className="text-sm text-gray-600">Tour request from {tenantName}</p>
          <p className="text-sm text-gray-500">{formatDate(scheduledAt)}</p>
          {notes && (
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium">Message:</span> {notes}
            </p>
          )}
        </div>

        {(approveState.status === "error" || declineState.status === "error") && (
          <div className="rounded-md bg-red-50 p-3">
            <p className="text-sm text-red-700">
              {(approveState.status === "error" ? approveState.message : "") || 
               (declineState.status === "error" ? declineState.message : "")}
            </p>
          </div>
        )}

        {(approveState.status === "success" || declineState.status === "success") && (
          <div className="rounded-md bg-green-50 p-3">
            <p className="text-sm text-green-700">
              Tour request {approveState.status === "success" ? "approved" : "declined"} successfully!
            </p>
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowNotes(!showNotes)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showNotes ? "Hide" : "Add"} response notes
          </button>

          {showNotes && (
            <div>
              <label htmlFor="response-notes" className="block text-sm font-medium text-gray-700">
                Notes for tenant (optional)
              </label>
              <textarea
                id="response-notes"
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Add any additional information or instructions..."
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
                maxLength={500}
              />
              <p className="mt-1 text-xs text-gray-500">
                {responseNotes.length}/500 characters
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <form action={approveAction}>
              <input type="hidden" name="tourId" value={tourId} />
              <input type="hidden" name="notes" value={responseNotes} />
              <Button
                type="submit"
                variant="primary"
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? "Processing..." : "Approve Tour"}
              </Button>
            </form>

            <form action={declineAction}>
              <input type="hidden" name="tourId" value={tourId} />
              <input type="hidden" name="notes" value={responseNotes} />
              <Button
                type="submit"
                variant="secondary"
                disabled={isProcessing}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                {isProcessing ? "Processing..." : "Decline Tour"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </Card>
  );
}
