import { describe, expect, it } from "vitest";
import { generateICS, createTourCalendarEvent } from "@/lib/ics";
import { format } from "date-fns";

describe("ICS Event Generation", () => {
  it("should generate a valid iCal event string for a property tour", () => {
    const tourData = {
      property: {
        title: "Test Property",
        address: "123 Test St"
      },
      scheduled_at: new Date("2024-01-01T10:00:00Z"),
      duration: 30
    };
    
    const event = createTourCalendarEvent(tourData);
    const ics = generateICS(event);

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("SUMMARY:Property Tour: Test Property");
    expect(ics).toContain("LOCATION:123 Test St");
    expect(ics).toContain("DESCRIPTION:Property viewing appointment scheduled through RentoH");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("should escape special characters in the event fields", () => {
    const tourData = {
      property: {
        title: "Property with, semicolon;",
        address: "123 Test St, Apt 4;"
      },
      scheduled_at: new Date("2024-01-01T10:00:00Z"),
      duration: 30
    };

    const event = createTourCalendarEvent(tourData);
    const ics = generateICS(event);

    expect(ics).toContain("SUMMARY:Property Tour: Property with\\, semicolon\\;");
    expect(ics).toContain("LOCATION:123 Test St\\, Apt 4\\;");
  });

  it("should calculate correct end time based on duration", () => {
    const tourData = {
      property: {
        title: "Test Property",
        address: "123 Test St"
      },
      scheduled_at: new Date("2024-01-01T10:00:00Z"),
      duration: 45
    };

    const event = createTourCalendarEvent(tourData);
    const ics = generateICS(event);
    
    // 45 minutes from 10:00 is 10:45 UTC
    const endDate = new Date(tourData.scheduled_at.getTime() + 45 * 60 * 1000);
    const expectedEnd = `DTEND:${format(endDate, "yyyyMMdd'T'HHmmss'Z'")}`;
    expect(ics).toContain(expectedEnd);
  });

  it("should use default 30 minute duration when not specified", () => {
    const tourData = {
      property: {
        title: "Test Property",
        address: "123 Test St"
      },
      scheduled_at: new Date("2024-01-01T10:00:00Z")
    };

    const event = createTourCalendarEvent(tourData);
    const ics = generateICS(event);
    
    // 30 minutes from 10:00 is 10:30 UTC
    const endDate = new Date(tourData.scheduled_at.getTime() + 30 * 60 * 1000);
    const expectedEnd = `DTEND:${format(endDate, "yyyyMMdd'T'HHmmss'Z'")}`;
    expect(ics).toContain(expectedEnd);
  });
});