import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import CalendarMenu from "@/components/interviews/CalendarMenu";
import { MapPin, Pencil, PhoneCall, Trash2, Clock } from "lucide-react";

export default function InterviewCard({ interview, onEdit, onDelete }) {
  const start = new Date(interview.interview_date_time);
  const upcoming = start.getTime() >= Date.now() - 12 * 60 * 60 * 1000;

  return (
    <article className="paper-panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.08em] ${
                upcoming ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
              }`}
            >
              {upcoming ? "Upcoming" : "Past"}
            </span>
          </div>
          <h3 className="mt-2 truncate text-[0.98rem] font-semibold leading-snug">
            {interview.position_title}
          </h3>
          <p className="truncate text-[0.8rem] text-muted-foreground">{interview.company_name}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground"
            onClick={() => onEdit(interview)}
            aria-label="Edit interview"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(interview)}
            aria-label="Delete interview"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <dl className="mt-4 space-y-1.5 text-[0.78rem]">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <dt className="sr-only">When</dt>
          <dd className="tabular font-medium">{formatDateTime(interview.interview_date_time)}</dd>
        </div>
        {interview.company_location ? (
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <dd className="truncate text-muted-foreground">{interview.company_location}</dd>
          </div>
        ) : null}
        {interview.callback_time_frame ? (
          <div className="flex items-center gap-2">
            <PhoneCall className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <dd className="truncate text-muted-foreground">
              Callback: {interview.callback_time_frame}
            </dd>
          </div>
        ) : null}
      </dl>

      {interview.notes ? (
        <p className="mt-3 rounded-lg bg-secondary/60 px-3 py-2 text-[0.75rem] leading-relaxed text-muted-foreground">
          {interview.notes}
        </p>
      ) : null}

      <div className="mt-4">
        <CalendarMenu interview={interview} />
      </div>
    </article>
  );
}