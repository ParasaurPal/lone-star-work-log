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
  const start = weekEndingSaturday(value);
  if (Number.isNaN(start.getTime())) return start;
  start.setDate(start.getDate() - 6);
  return start;
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
  const start = weekStartingSunday(value);
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
  if (Number.isNaN(date.getTime())) return date;
  date.setDate(date.getDate() + weeks * 7);
  return date;
}

export function daysLeftInWeek(value) {
  const end = weekEndingSaturday(value);
  const today = startOfDay();
  const endDay = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  const todayDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.max(0, Math.round((endDay - todayDay) / DAY));
}
