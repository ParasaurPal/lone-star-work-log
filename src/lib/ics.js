const PRODUCT_ID = "-//LoneStar WorkLog//Interview Calendar//EN";

function icsStamp(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function eventFor(interview) {
  const start = new Date(interview.interview_date_time);
  if (Number.isNaN(start.getTime())) return null;

  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const summary = `Interview — ${interview.position_title || "Position"} at ${interview.company_name || "Company"}`;
  const description = [
    interview.position_title ? `Position: ${interview.position_title}` : null,
    interview.company_name ? `Company: ${interview.company_name}` : null,
    interview.callback_time_frame ? `Callback window: ${interview.callback_time_frame}` : null,
    interview.notes || null,
    "Logged in LoneStar WorkLog",
  ]
    .filter(Boolean)
    .join("\n");

  const lines = [
    "BEGIN:VEVENT",
    `UID:${interview.id}@lonestar-worklog`,
    `DTSTAMP:${icsStamp(interview.updated_date) || icsStamp(new Date())}`,
    `DTSTART:${icsStamp(start)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${escapeText(summary)}`,
    `DESCRIPTION:${escapeText(description)}`,
  ];
  if (interview.company_location) lines.push(`LOCATION:${escapeText(interview.company_location)}`);
  lines.push("END:VEVENT");
  return lines.join("\r\n");
}

/** Builds a subscribable iCalendar feed from the claimant's interviews. */
export function buildInterviewFeed(interviews) {
  const events = (interviews || []).map(eventFor).filter(Boolean);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PRODUCT_ID}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:LoneStar WorkLog Interviews",
    "X-WR-CALDESC:Interviews logged in LoneStar WorkLog",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
    ...events,
    "END:VCALENDAR",
  ];
  return `${lines.join("\r\n")}\r\n`;
}