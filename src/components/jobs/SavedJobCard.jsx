import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/format";
import { ArrowUpRight, ExternalLink, Trash2, Briefcase } from "lucide-react";

export const SAVED_STATUS_OPTIONS = [
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "rejected", label: "Rejected" },
  { value: "archived", label: "Archived" },
];

const STATUS_STYLES = {
  saved: "border-sky-200 bg-sky-50 text-sky-800",
  applied: "border-emerald-200 bg-emerald-50 text-emerald-800",
  interviewing: "border-amber-200 bg-amber-50 text-amber-900",
  rejected: "border-rose-200 bg-rose-50 text-rose-800",
  archived: "border-stone-200 bg-stone-100 text-stone-600",
};

export default function SavedJobCard({ job, onStatusChange, onConvert, onDelete, converting }) {
  const applied = job.status === "applied";

  return (
    <article className="paper-panel p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[0.92rem] font-semibold leading-snug tracking-tight">{job.title}</h3>
          <p className="mt-0.5 truncate text-[0.78rem] text-muted-foreground">
            {job.company}
            {job.location ? ` · ${job.location}` : ""}
          </p>
        </div>
        <span
          className={`rounded-full border px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.08em] ${
            STATUS_STYLES[job.status] || STATUS_STYLES.saved
          }`}
        >
          {job.source_label || job.source}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {job.salary ? (
          <span className="tabular rounded-full border border-border bg-secondary/70 px-2 py-0.5 text-[0.68rem]">
            {job.salary}
          </span>
        ) : null}
        {job.type ? (
          <span className="rounded-full border border-border px-2 py-0.5 text-[0.68rem] capitalize text-muted-foreground">
            {job.type}
          </span>
        ) : null}
        {job.level ? (
          <span className="rounded-full border border-border px-2 py-0.5 text-[0.68rem] capitalize text-muted-foreground">
            {job.level}
          </span>
        ) : null}
        <span className="text-[0.68rem] text-muted-foreground">
          Saved {formatDate(job.created_date)}
          {job.posted_at ? ` · Posted ${formatDate(job.posted_at)}` : ""}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
        <Select value={job.status} onValueChange={(value) => onStatusChange(job, value)}>
          <SelectTrigger className="h-8 w-32 text-[0.75rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SAVED_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value} className="text-[0.8rem]">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {job.url ? (
          <Button asChild variant="ghost" size="sm" className="h-8 rounded-full px-2 text-[0.75rem]">
            <a href={job.url} target="_blank" rel="noreferrer">
              Listing
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        ) : null}

        <Button
          size="sm"
          variant={applied ? "secondary" : "outline"}
          className="h-8 gap-1.5 rounded-full px-3 text-[0.75rem]"
          disabled={applied || converting}
          onClick={() => onConvert(job)}
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
          {applied ? "In tracker" : "Convert to application"}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-8 gap-1.5 rounded-full px-2 text-[0.75rem] text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(job)}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      </div>

      {applied ? (
        <p className="mt-2 flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
          <Briefcase className="h-3 w-3" />
          Logged in your work search record.
        </p>
      ) : null}
    </article>
  );
}