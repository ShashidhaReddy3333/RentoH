import { format } from 'date-fns';

interface ICSEvent {
  start: Date;
  end: Date;
  summary: string;
  description: string;
  location?: string;
  url?: string;
}

export function generateICS(event: ICSEvent): string {
  const formatDate = (date: Date) =>
    format(date, "yyyyMMdd'T'HHmmss'Z'");

  const escapeText = (text: string) =>
    text.replace(/[\\,;]/g, (match) => '\\' + match);

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RentoH//Property Tours//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `DTSTART:${formatDate(event.start)}`,
    `DTEND:${formatDate(event.end)}`,
    `SUMMARY:${escapeText(event.summary)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
  ];

  if (event.location) {
    ics.push(`LOCATION:${escapeText(event.location)}`);
  }

  if (event.url) {
    ics.push(`URL:${event.url}`);
  }

  ics.push(
    'END:VEVENT',
    'END:VCALENDAR'
  );

  return ics.join('\r\n');
}

export function generateGoogleCalendarUrl(event: ICSEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.summary,
    details: event.description,
    dates: `${formatDate(event.start)}/${formatDate(event.end)}`,
  });

  if (event.location) {
    params.append('location', event.location);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function formatDate(date: Date): string {
  return date.toISOString().replace(/[:-]/g, '').replace(/\.\d{3}/, '');
}

export function createTourCalendarEvent(tour: {
  property: {
    title: string;
    address: string;
  };
  scheduled_at: Date;
  duration?: number; // in minutes, defaults to 30
}): ICSEvent {
  const start = new Date(tour.scheduled_at);
  const end = new Date(start.getTime() + (tour.duration || 30) * 60 * 1000);

  return {
    start,
    end,
    summary: `Property Tour: ${tour.property.title}`,
    description: 'Property viewing appointment scheduled through RentoH',
    location: tour.property.address,
  };
}