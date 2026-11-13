import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WeekHeader({ name, weekLabel, onPrev, onNext, onToday, extraActions }) {
  const firstName = (name || "").trim().split(" ")[0];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-primary">
            Work search log
          </p>
          <h1 className="display-title mt-1.5 text-[1.75rem] leading-tight sm:text-[2.1rem]">
            {firstName ? `Good to see you, ${firstName}` : "Good to see you"}
          </h1>
          <p className="mt-1 text-[0.82rem] text-muted-foreground">
            Tracking your TWC compliance, one week at a time.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {extraActions}
          <Button asChild variant="outline" className="h-9 gap-1.5 rounded-full px-4 text-[0.8rem]">
            <Link to="/export">
              <Download className="h-3.5 w-3.5" />
              Export PDF
            </Link>
          </Button>
          <Button asChild className="h-9 gap-1.5 rounded-full px-4 text-[0.8rem]">
            <Link to="/applications">
              <Plus className="h-3.5 w-3.5" />
              Log application
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onPrev}
          className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Previous week"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="tabular rounded-full border border-border bg-card px-3.5 py-1.5 text-[0.75rem] font-medium">
          Week ending {weekLabel}
        </span>
        <button
          type="button"
          onClick={onNext}
          className="grid h-8 w-8 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Next week"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToday}
          className="ml-1 text-[0.75rem] font-medium text-primary underline-offset-4 hover:underline"
        >
          This week
        </button>
      </div>
    </div>
  );
}