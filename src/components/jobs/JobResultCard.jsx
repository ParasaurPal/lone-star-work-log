import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { Bookmark, BookmarkCheck, ExternalLink } from "lucide-react";

export default function JobResultCard({ job, saved, saving, onSave }) {
  return (
    <article className="paper-panel flex flex-col gap-2.5 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[0.92rem] font-semibold leading-snug tracking-tight">{job.title}</h3>
          <p className="mt-0.5 truncate text-[0.78rem] text-muted-foreground">
            {job.company} · {job.location}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-primary">
          {job.source_label}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
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
        {job.posted_at ? (
          <span className="text-[0.68rem] text-muted-foreground">Posted {formatDate(job.posted_at)}</span>
        ) : null}
      </div>

      <p className="line-clamp-3 text-[0.78rem] leading-relaxed text-muted-foreground">
        {job.snippet || "No description provided on the listing."}
      </p>

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <Button asChild variant="ghost" size="sm" className="h-8 rounded-full px-2 text-[0.75rem]">
          <a href={job.url} target="_blank" rel="noreferrer">
            View listing
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
        <Button
          size="sm"
          variant={saved ? "secondary" : "default"}
          className="h-8 gap-1.5 rounded-full px-3 text-[0.75rem]"
          disabled={saved || saving}
          onClick={() => onSave(job)}
        >
          {saved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
          {saved ? "Saved" : "Save job"}
        </Button>
      </div>
    </article>
  );
}