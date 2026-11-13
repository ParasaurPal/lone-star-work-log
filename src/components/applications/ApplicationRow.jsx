import StatusBadge from "@/components/StatusBadge";
import CalendarMenu from "@/components/interviews/CalendarMenu";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { CalendarPlus, Pencil, Trash2 } from "lucide-react";

export default function ApplicationRow({ application, interview, onEdit, onDelete, onAddInterview }) {
  return (
    <div className="flex flex-col gap-3 border-b border-border/60 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 gap-3">
        <div className="tabular w-12 shrink-0 pt-0.5 text-[0.7rem] font-semibold uppercase leading-tight text-muted-foreground">
          {formatDate(application.date_applied, { month: "short", day: "numeric", year: undefined })}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[0.92rem] font-medium leading-snug">
            {application.position_title}
          </p>
          <p className="truncate text-[0.78rem] text-muted-foreground">
            {application.company_name} · {application.job_location}
          </p>
          <p className="mt-1 truncate text-[0.72rem] text-muted-foreground">
            {application.application_method}
            {application.contact_info ? ` · ${application.contact_info}` : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <StatusBadge status={application.status} />
        {interview ? (
          <CalendarMenu interview={interview} label="Calendar" />
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-full px-3 text-[0.72rem]"
            onClick={() => onAddInterview(application)}
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            Add interview
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-muted-foreground"
          onClick={() => onEdit(application)}
          aria-label="Edit application"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(application)}
          aria-label="Delete application"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}