import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { localStore } from "@/api/localStore";
import PageIntro from "@/components/PageIntro";
import ApplicationForm from "@/components/applications/ApplicationForm";
import ApplicationRow from "@/components/applications/ApplicationRow";
import InterviewForm from "@/components/interviews/InterviewForm";
import ScreenshotImport from "@/components/ScreenshotImport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { STATUS_OPTIONS } from "@/components/appNav";
import { useApplications, useInterviews } from "@/lib/useLogData";
import { formatDate } from "@/lib/format";
import { Plus, Search, ImagePlus, Briefcase } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authed/applications")({
  head: () => ({ meta: [{ title: "Applications — LoneStar WorkLog" }] }),
  component: ApplicationsPage,
});

function ApplicationsPage() {
  const { items, loading, reload } = useApplications();
  const { items: interviews, reload: reloadInterviews } = useInterviews();
  const [search, setSearch] = useState("");
  const [week, setWeek] = useState("all");
  const [status, setStatus] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [prefill, setPrefill] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [interviewFor, setInterviewFor] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const weeks = useMemo(() => {
    const unique = [...new Set(items.map((item) => item.twc_week_ending).filter(Boolean))];
    return unique.sort((a, b) => (a < b ? 1 : -1));
  }, [items]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      if (week !== "all" && item.twc_week_ending !== week) return false;
      if (status !== "all" && item.status !== status) return false;
      if (!term) return true;
      return `${item.company_name} ${item.position_title} ${item.job_location} ${item.contact_info}`
        .toLowerCase()
        .includes(term);
    });
  }, [items, search, week, status]);

  const grouped = useMemo(() => {
    const map = new Map();
    filtered.forEach((item) => {
      const key = item.twc_week_ending || "unscheduled";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filtered]);

  const interviewByApplication = useMemo(() => {
    const map = {};
    interviews.forEach((interview) => {
      if (interview.application_id) map[interview.application_id] = interview;
    });
    return map;
  }, [interviews]);

  const refresh = () => {
    reload();
    reloadInterviews();
  };

  const openNew = () => {
    setEditing(null);
    setPrefill(null);
    setFormOpen(true);
  };

  const openEdit = (application) => {
    setEditing(application);
    setPrefill(null);
    setFormOpen(true);
  };

  const handleExtracted = (fields) => {
    setEditing(null);
    setPrefill({
      company_name: fields.company_name || "",
      position_title: fields.position_title || "",
      job_location: fields.job_location || fields.company_location || "",
      contact_info: fields.contact_info || "",
      notes: fields.notes || "",
    });
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await localStore.entities.JobApplication.delete(pendingDelete.id);
      toast.success("Application removed");
      refresh();
    } catch (err) {
      toast.error("Couldn't remove that entry.");
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageIntro
        eyebrow="Work search record"
        title="Applications"
        description="Every contact you make counts. Keep the details an auditor would ask for."
        actions={
          <>
            <Button
              variant="outline"
              className="h-9 gap-1.5 rounded-full px-4 text-[0.8rem]"
              onClick={() => setImportOpen(true)}
            >
              <ImagePlus className="h-3.5 w-3.5" />
              Upload screenshot
            </Button>
            <Button className="h-9 gap-1.5 rounded-full px-4 text-[0.8rem]" onClick={openNew}>
              <Plus className="h-3.5 w-3.5" />
              Log application
            </Button>
          </>
        }
      />

      <div className="paper-panel flex flex-col gap-2.5 p-3.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search company, position, or location"
            className="h-9 pl-9 text-[0.82rem]"
          />
        </div>
        <Select value={week} onValueChange={setWeek}>
          <SelectTrigger className="h-9 w-full text-[0.8rem] sm:w-52">
            <SelectValue placeholder="All weeks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All weeks</SelectItem>
            {weeks.map((value) => (
              <SelectItem key={value} value={value}>
                Week ending {formatDate(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-full text-[0.8rem] sm:w-40">
            <SelectValue placeholder="All results" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All results</SelectItem>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="paper-panel space-y-4 p-5">
          {[0, 1, 2, 3].map((key) => (
            <div key={key} className="flex items-center gap-3">
              <Skeleton className="h-3 w-10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div className="paper-panel flex flex-col items-center px-6 py-14 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <Briefcase className="h-5 w-5" />
          </span>
          <h2 className="display-title mt-4 text-lg">
            {items.length === 0 ? "No work searches logged yet" : "Nothing matches those filters"}
          </h2>
          <p className="mt-1.5 max-w-sm text-[0.8rem] leading-relaxed text-muted-foreground">
            {items.length === 0
              ? "Log your first application, or upload a screenshot of the confirmation email and we'll fill it in for you."
              : "Try a different week or clear the search to see the rest of your record."}
          </p>
          {items.length === 0 ? (
            <Button className="mt-5 h-9 rounded-full px-5 text-[0.8rem]" onClick={openNew}>
              <Plus className="h-3.5 w-3.5" />
              Log your first application
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([weekEnding, entries]) => (
            <section key={weekEnding} className="paper-panel px-5 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 pb-2">
                <h2 className="text-[0.85rem] font-semibold tracking-tight">
                  {weekEnding === "unscheduled"
                    ? "Unassigned week"
                    : `Week ending ${formatDate(weekEnding)}`}
                </h2>
                <span className="tabular text-[0.72rem] text-muted-foreground">
                  {entries.length} {entries.length === 1 ? "contact" : "contacts"}
                </span>
              </div>
              <div>
                {entries.map((application) => (
                  <ApplicationRow
                    key={application.id}
                    application={application}
                    interview={interviewByApplication[application.id]}
                    onEdit={openEdit}
                    onDelete={setPendingDelete}
                    onAddInterview={(app) =>
                      setInterviewFor({
                        company_name: app.company_name,
                        position_title: app.position_title,
                        company_location: app.job_location,
                        application_id: app.id,
                      })
                    }
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <ApplicationForm
        open={formOpen}
        onOpenChange={setFormOpen}
        application={editing}
        initial={prefill}
        onSaved={refresh}
      />

      <ScreenshotImport
        open={importOpen}
        onOpenChange={setImportOpen}
        kind="application"
        onExtracted={handleExtracted}
      />

      <InterviewForm
        open={Boolean(interviewFor)}
        onOpenChange={(next) => !next && setInterviewFor(null)}
        initial={interviewFor}
        onSaved={refresh}
      />

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(next) => !next && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this application?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `${pendingDelete.position_title} at ${pendingDelete.company_name} will be removed from your work search record.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Keep it</AlertDialogCancel>
            <AlertDialogAction className="rounded-full" onClick={confirmDelete}>
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}