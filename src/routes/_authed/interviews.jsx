import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { localStore } from "@/api/localStore";
import PageIntro from "@/components/PageIntro";
import InterviewCard from "@/components/interviews/InterviewCard";
import InterviewForm from "@/components/interviews/InterviewForm";
import ScreenshotImport from "@/components/ScreenshotImport";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useInterviews } from "@/lib/useLogData";
import { toDateTimeInput } from "@/lib/format";
import { CalendarDays, ImagePlus, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authed/interviews")({
  head: () => ({ meta: [{ title: "Interviews — LoneStar WorkLog" }] }),
  component: InterviewsPage,
});

function InterviewsPage() {
  const { items, loading, reload } = useInterviews();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [prefill, setPrefill] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [filter, setFilter] = useState("upcoming");

  const { upcoming, past } = useMemo(() => {
    const now = Date.now() - 12 * 60 * 60 * 1000;
    return {
      upcoming: items.filter((item) => new Date(item.interview_date_time).getTime() >= now),
      past: items
        .filter((item) => new Date(item.interview_date_time).getTime() < now)
        .reverse(),
    };
  }, [items]);

  const visible = filter === "upcoming" ? upcoming : filter === "past" ? past : items;

  const handleExtracted = (fields) => {
    setEditing(null);
    setPrefill({
      company_name: fields.company_name || "",
      position_title: fields.position_title || "",
      company_location: fields.company_location || "",
      callback_time_frame: fields.callback_time_frame || "",
      notes: fields.notes || "",
      interview_date_time: fields.interview_date_time
        ? toDateTimeInput(fields.interview_date_time)
        : "",
    });
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await localStore.entities.Interview.delete(pendingDelete.id);
      toast.success("Interview removed");
      reload();
    } catch (err) {
      toast.error("Couldn't remove that interview.");
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageIntro
        eyebrow="Calendar"
        title="Interviews"
        description="Keep every invite, location, and callback window in one place — then send it straight to your calendar."
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
            <Button
              className="h-9 gap-1.5 rounded-full px-4 text-[0.8rem]"
              onClick={() => {
                setEditing(null);
                setPrefill(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              New interview
            </Button>
          </>
        }
      />

      <div className="inline-flex rounded-full border border-border bg-card p-1">
        {[
          { key: "upcoming", label: `Upcoming (${upcoming.length})` },
          { key: "past", label: `Past (${past.length})` },
          { key: "all", label: "All" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`rounded-full px-3.5 py-1.5 text-[0.75rem] font-medium transition-colors ${
              filter === tab.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((key) => (
            <div key={key} className="paper-panel space-y-3 p-5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-8 w-32 rounded-full" />
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="paper-panel flex flex-col items-center px-6 py-14 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <CalendarDays className="h-5 w-5" />
          </span>
          <h2 className="display-title mt-4 text-lg">
            {filter === "past" ? "No past interviews" : "No interviews scheduled"}
          </h2>
          <p className="mt-1.5 max-w-sm text-[0.8rem] leading-relaxed text-muted-foreground">
            Upload the invite email and we'll read the company, time, and location for you.
          </p>
          <Button
            className="mt-5 h-9 rounded-full px-5 text-[0.8rem]"
            onClick={() => setImportOpen(true)}
          >
            <ImagePlus className="h-3.5 w-3.5" />
            Upload an invite
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {visible.map((interview) => (
            <InterviewCard
              key={interview.id}
              interview={interview}
              onEdit={(item) => {
                setEditing(item);
                setPrefill(null);
                setFormOpen(true);
              }}
              onDelete={setPendingDelete}
            />
          ))}
        </div>
      )}

      <InterviewForm
        open={formOpen}
        onOpenChange={setFormOpen}
        interview={editing}
        initial={prefill}
        onSaved={reload}
      />

      <ScreenshotImport
        open={importOpen}
        onOpenChange={setImportOpen}
        kind="interview"
        onExtracted={handleExtracted}
      />

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(next) => !next && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this interview?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `${pendingDelete.position_title} at ${pendingDelete.company_name} will be deleted from your log.`
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