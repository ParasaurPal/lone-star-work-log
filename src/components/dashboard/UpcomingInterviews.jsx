import { CalendarDays, Clock } from "lucide-react";

export default function UpcomingInterviews({ items = [] }) {
  return (
    <section className="paper-panel p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[0.95rem] font-semibold tracking-tight">Upcoming interviews</h2>
        <CalendarDays className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
      </div>

      {items.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-6 text-center text-[0.78rem] text-muted-foreground">
          Nothing scheduled. Interviews you add will appear here.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-border/80 bg-secondary/50 p-3">
              <p className="text-[0.85rem] font-medium leading-snug">{item.position_title}</p>
              <p className="text-[0.75rem] text-muted-foreground">{item.company_name}</p>
              <p className="tabular mt-2 flex items-center gap-1.5 text-[0.72rem] font-medium text-foreground/80">
                <Clock className="h-3 w-3" />
                {item.when}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}