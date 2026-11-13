const DAY = 24 * 60 * 60 * 1000;

export function startOfDay(value) {
  const date = value ? new Date(value) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

/** TWC reporting weeks run Sunday → Saturday. */
export function weekEndingSaturday(value) {
  const date = startOfDay(value);
  date.setDate(date.getDate() + (6 - date.getDay()));
  return date;
}

export function weekStartingSunday(value) {
  const end = weekEndingSaturday(value);
  return new Date(end.getTime() - 6 * DAY);
}

export function isoDate(value) {
  const date = startOfDay(value);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function shortDate(value) {
  return startOfDay(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function weekRangeLabel(value) {
  const end = weekEndingSaturday(value);
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