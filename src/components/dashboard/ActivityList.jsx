import StatusBadge from "@/components/StatusBadge";
import { MapPin } from "lucide-react";

export default function ActivityList({ entries = [], emptyLabel = "No searches logged yet." }) {
  if (!entries.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-5 py-10 text-center">
        <p className="text-sm font-medium">{emptyLabel}</p>
        <p className="mt-1 text-[0.8rem] text-muted-foreground">
          Every application you log counts toward your weekly work search requirement.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/70">
      {entries.map((entry) => (
        <li key={entry.id} className="flex flex-wrap items-start justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
          <div className="flex min-w-0 gap-3">
            <div className="tabular mt-0.5 w-9 shrink-0 text-[0.72rem] font-semibold uppercase leading-tight text-muted-foreground">
              {entry.dayLabel}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[0.9rem] font-medium">{entry.position_title}</p>
              <p className="truncate text-[0.78rem] text-muted-foreground">{entry.company_name}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[0.72rem] text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">
                  {entry.job_location} · {entry.application_method}
                </span>
              </p>
            </div>
          </div>
          <StatusBadge status={entry.status} />
        </li>
      ))}
    </ul>
  );
}