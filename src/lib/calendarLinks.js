import { shortDate } from "@/lib/twcWeeks";

function pad(value) {
  return String(value).padStart(2, "0");
}

/** Converts a datetime-local string into a compact UTC stamp for calendar URLs. */
function stamp(date) {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T` +
    `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00Z`
  );
}

export function calendarEvent(interview) {
  const start = new Date(interview.interview_date_time);
  const valid = !Number.isNaN(start.getTime());
  const end = valid ? new Date(start.getTime() + 60 * 60 * 1000) : null;

  const details = [
    interview.callback_time_frame ? `Callback: ${interview.callback_time_frame}` : null,
    interview.notes || null,
    "Logged in LoneStar WorkLog",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    title: `Interview: ${interview.position_title} at ${interview.company_name}`,
    location: interview.company_location || "",
    details,
    start: valid ? start : null,
    end,
  };
}

export function googleCalendarUrl(interview) {
  const event = calendarEvent(interview);
  if (!event.start) return null;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${stamp(event.start)}/${stamp(event.end)}`,
    details: event.details,
    location: event.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function outlookCalendarUrl(interview) {
  const event = calendarEvent(interview);
  if (!event.start) return null;
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.title,
    startdt: event.start.toISOString(),
    enddt: event.end.toISOString(),
    body: event.details,
    location: event.location,
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

export function downloadIcs(interview) {
  const event = calendarEvent(interview);
  if (!event.start) return;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LoneStar WorkLog//TWC Interview//EN",
    "BEGIN:VEVENT",
    `UID:${interview.id || Date.now()}@lonestar-worklog`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(event.start)}`,
    `DTEND:${stamp(event.end)}`,
    `SUMMARY:${event.title}`,
    `LOCATION:${event.location.replace(/\n/g, " ")}`,
    `DESCRIPTION:${event.details.replace(/\n/g, "\\n")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `interview-${shortDate(interview.interview_date_time).replace(/\s/g, "-")}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}