const DAY = 24 * 60 * 60 * 1000;

export function startOfDay(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date(NaN);
  date.setHours(0, 0, 0, 0);
  return date;
}

/** TWC reporting weeks run Sunday → Saturday, using the device's local calendar date. */
export function weekEndingSaturday(value) {
  const date = startOfDay(value);
  if (Number.isNaN(date.getTime())) return date;
  date.setDate(date.getDate() + (6 - date.getDay()));
  return date;
}

export function weekStartingSunday(value) {
  const end = weekEndingSaturday(value);
  return new Date(end.getTime() - 6 * DAY);
}

export function isoDate(value) {
  const date = startOfDay(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function isSaturday(value) {
  const date = startOfDay(value);
  return !Number.isNaN(date.getTime()) && date.getDay() === 6;
}

export function shortDate(value) {
  const date = startOfDay(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function weekRangeLabel(value) {
  const end = weekEndingSaturday(value);
  if (Number.isNaN(end.getTime())) return "Invalid week";
  const start = new Date(end.getTime() - 6 * DAY);
  const sameMonth = start.getMonth() === end.getMonth();
  const startLabel = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameMonth ? {} : { year: "numeric" }),
  });
  const endLabel = end.toLocaleDateString("en-US", {
    month: sameMonth ? undefined : "short",
    day: "numeric",
    year: "numeric",
  });
  return `${startLabel} – ${endLabel}`;
}

export function shiftWeek(value, weeks) {
  const date = weekEndingSaturday(value);
  return new Date(date.getTime() + weeks * 7 * DAY);
}

export function daysLeftInWeek(value) {
  const end = weekEndingSaturday(value);
  const today = startOfDay();
  return Math.max(0, Math.round((end.getTime() - today.getTime()) / DAY));
}
