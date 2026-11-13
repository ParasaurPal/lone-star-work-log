import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export default function ComplianceCard({
  logged,
  goal,
  rangeLabel,
  daysLeft,
  className,
  children,
}) {
  const safeGoal = Math.max(1, goal);
  const pct = Math.min(100, Math.round((logged / safeGoal) * 100));
  const met = logged >= safeGoal;
  const segments = Array.from({ length: Math.min(safeGoal, 8) });

  return (
    <section className={cn("paper-panel relative overflow-hidden p-5 sm:p-7", className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-2xl"
      />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            TWC benefit week
          </p>
          <h2 className="display-title mt-1.5 text-[1.5rem] leading-tight sm:text-[1.75rem]">
            {logged} of {safeGoal} searches logged
          </h2>
          <p className="mt-1 text-[0.8rem] text-muted-foreground">
            {rangeLabel} · {met ? "requirement met" : `${safeGoal - logged} still to log`}
            {daysLeft > 0 && !met ? ` · ${daysLeft} day${daysLeft === 1 ? "" : "s"} left` : ""}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.72rem] font-semibold",
            met ? "bg-emerald-600/10 text-emerald-800" : "bg-amber-500/15 text-amber-900",
          )}
        >
          {met ? <Check className="h-3.5 w-3.5" /> : null}
          {met ? "On track" : `${pct}% complete`}
        </span>
      </div>

      <div className="relative mt-6">
        <div className="flex gap-1.5">
          {segments.map((_, index) => (
            <span
              key={index}
              className={cn(
                "h-2 flex-1 rounded-full transition-colors duration-500",
                index < logged ? "bg-primary" : "bg-border",
              )}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[0.7rem] text-muted-foreground">
          <span>Sunday</span>
          <span>Saturday</span>
        </div>
      </div>

      {children ? <div className="relative mt-6">{children}</div> : null}
    </section>
  );
}