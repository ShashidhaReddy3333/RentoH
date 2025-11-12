import { describe, expect, it } from "vitest";

import {
  ACTIONABLE_TOUR_STATUSES,
  isActionableStatus,
  landlordActionsFor
} from "@/lib/tours/status";

describe("landlord tour actions", () => {
  it("offers confirm/cancel for requested tours", () => {
    const actions = landlordActionsFor("requested").map((action) => action.status);
    expect(actions).toEqual(["confirmed", "cancelled"]);
  });

  it("offers complete/cancel for confirmed tours", () => {
    const actions = landlordActionsFor("confirmed").map((action) => action.status);
    expect(actions).toEqual(["completed", "cancelled"]);
  });

  it("allows reconfirming rescheduled tours", () => {
    const actions = landlordActionsFor("rescheduled").map((action) => action.status);
    expect(actions).toEqual(["confirmed", "cancelled"]);
  });
});

describe("actionable tour status helpers", () => {
  it("tracks the exact actionable statuses", () => {
    expect(ACTIONABLE_TOUR_STATUSES).toEqual(["confirmed", "completed", "cancelled"]);
  });

  it("identifies actionable statuses", () => {
    expect(isActionableStatus("confirmed")).toBe(true);
    expect(isActionableStatus("completed")).toBe(true);
    expect(isActionableStatus("cancelled")).toBe(true);
    expect(isActionableStatus("requested")).toBe(false);
    expect(isActionableStatus("rescheduled")).toBe(false);
  });
});
