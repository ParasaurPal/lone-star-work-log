import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function monthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function timeLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** Month grid of upcoming interviews, with company name and time. */
export default function InterviewCalendar({ interviews = [] }) {
  const [cursor, setCursor] = useState(() => monthStart(new Date()));

  const upcoming = useMemo(() => {
    const now = Date.now();
    return interviews
      .filter((item) => item.interview_date_time && new Date(item.interview_date_time).getTime() >= now)
      .sort((a, b) => new Date(a.interview_date_time) - new Date(b.interview_date_time));
  }, [interviews]);

  const byDay = useMemo(() => {
    const map = {};
    upcoming.forEach((item) => {
      const key = dayKey(new Date(item.interview_date_time));
      map[key] = [...(map[key] || []), item];
    });
    return map;
  }, [upcoming]);

  const monthInterviews = upcoming.filter((item) => {
    const date = new Date(item.interview_date_time);
    return date.getFullYear() === cursor.getFullYear() && date.getMonth() === cursor.getMonth();
  });

  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const leading = cursor.getDay();
  const todayKey = dayKey(new Date());

  const shiftMonth = (delta) => setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));

  return (
    <section className="paper-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[0.95rem] font-semibold tracking-tight">Interview calendar</h2>
          <p className="text-[0.75rem] text-muted-foreground">
            {upcoming.length} upcoming {upcoming.length === 1 ? "interview" : "interviews"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="tabular rounded-full border border-border bg-card px-3 py-1 text-[0.72rem] font-medium">
            {cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="pb-1 text-center text-[0.58rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
          >
            {day.slice(0, 3)}
          </div>
        ))}
        {Array.from({ length: leading }).map((_, index) => (
          <div key={`blank-${index}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${day}`;
          const items = byDay[key] || [];
          const isToday = key === todayKey;
          return (
            <div
              key={key}
              className={cn(
                "min-h-[3.1rem] overflow-hidden rounded-lg border p-1",
                isToday ? "border-primary/45 bg-primary/[0.05]" : "border-border/60",
              )}
            >
              <span
                className={cn(
                  "tabular block text-[0.65rem] font-semibold",
                  isToday ? "text-primary" : "text-muted-foreground",
                )}
              >
                {day}
              </span>
              {items.slice(0, 2).map((item) => (
                <p
                  key={item.id}
                  title={`${item.company_name} · ${timeLabel(item.interview_date_time)}`}
                  className="mt-0.5 truncate rounded bg-secondary px-1 py-0.5 text-[0.58rem] leading-tight text-foreground"
                >
                  {item.company_name}
                </p>
              ))}
              {items.length > 2 ? (
                <p className="mt-0.5 text-[0.55rem] text-muted-foreground">+{items.length - 2} more</p>
              ) : null}
            </div>
          );
        })}
      </div>

      {monthInterviews.length > 0 ? (
        <ul className="mt-4 space-y-1.5 border-t border-border/70 pt-3">
          {monthInterviews.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3">
              <span className="min-w-0">
                <span className="block truncate text-[0.78rem] font-medium">{item.company_name}</span>
                <span className="block truncate text-[0.7rem] text-muted-foreground">
                  {item.position_title}
                </span>
              </span>
              <span className="tabular shrink-0 text-[0.72rem] text-muted-foreground">
                {formatDate(item.interview_date_time)} · {timeLabel(item.interview_date_time)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 border-t border-border/70 pt-3 text-[0.75rem] text-muted-foreground">
          No interviews scheduled this month.
        </p>
      )}
    </section>
  );
}