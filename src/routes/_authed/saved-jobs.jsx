import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { localStore } from "@/api/localStore";
import PageIntro from "@/components/PageIntro";
import SavedJobCard, { SAVED_STATUS_OPTIONS } from "@/components/jobs/SavedJobCard";
import { Button } from "@/components/ui/button";
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
import { useSavedJobs } from "@/lib/useSavedJobs";
import { isoDate, weekEndingSaturday } from "@/lib/twcWeeks";
import { Bookmark, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authed/saved-jobs")({
  head: () => ({ meta: [{ title: "Saved Jobs — LoneStar WorkLog" }] }),
  component: SavedJobsPage,
});

function SavedJobsPage() {
  const { items, loading, reload } = useSavedJobs();
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");
  const [sort, setSort] = useState("newest");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [convertingId, setConvertingId] = useState(null);

  const sources = useMemo(() => {
    const map = new Map();
    items.forEach((job) => {
      if (job.source) map.set(job.source, job.source_label || job.source);
    });
    return [...map.entries()];
  }, [items]);

  const filtered = useMemo(() => {
    const list = items.filter((job) => {
      if (status !== "all" && job.status !== status) return false;
      if (source !== "all" && job.source !== source) return false;
      return true;
    });
    return list.sort((a, b) => {
      const left = new Date(a.created_date || 0).getTime();
      const right = new Date(b.created_date || 0).getTime();
      return sort === "newest" ? right - left : left - right;
    });
  }, [items, status, source, sort]);

  const changeStatus = async (job, value) => {
    if (value === "applied") {
      await convertToApplication(job);
      return;
    }
    try {
      await localStore.entities.SavedJob.update(job.id, { status: value });
      toast.success("Status updated");
      reload();
    } catch (error) {
      toast.error("Couldn't update that job.");
    }
  };

  const convertToApplication = async (job) => {
    setConvertingId(job.id);
    try {
      const today = new Date();
      const application = await localStore.entities.JobApplication.create({
        date_applied: isoDate(today),
        company_name: job.company,
        position_title: job.title,
        job_location: job.location || "Remote",
        application_method: "Online",
        status: "Applied",
        contact_info: job.url || "",
        job_posting_url: job.url || "",
        twc_week_ending: isoDate(weekEndingSaturday(today)),
        notes: `Added from JobSweep (${job.source_label || job.source}). Listing: ${job.url || "n/a"}`,
      });
      await localStore.entities.SavedJob.update(job.id, {
        status: "applied",
        application_id: application.id,
        date_applied: isoDate(today),
      });
      toast.success("Added to your work search record");
      reload();
    } catch (error) {
      toast.error("Couldn't convert that job.");
    } finally {
      setConvertingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await localStore.entities.SavedJob.delete(pendingDelete.id);
      toast.success("Saved job removed");
      reload();
    } catch (error) {
      toast.error("Couldn't remove that job.");
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageIntro
        eyebrow="Shortlist"
        title="Saved Jobs"
        description="Everything you kept from the boards. Convert a listing into a tracked application when you make contact."
        actions={
          <Button asChild className="h-9 gap-1.5 rounded-full px-4 text-[0.8rem]">
            <Link to="/job-search">
              <Search className="h-3.5 w-3.5" />
              Search boards
            </Link>
          </Button>
        }
      />

      <div className="paper-panel flex flex-col gap-2.5 p-3.5 sm:flex-row sm:items-center">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-9 w-full text-[0.8rem] sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {SAVED_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={source} onValueChange={setSource}>
          <SelectTrigger className="h-9 w-full text-[0.8rem] sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All boards</SelectItem>
            {sources.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="h-9 w-full text-[0.8rem] sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest saved</SelectItem>
            <SelectItem value="oldest">Oldest saved</SelectItem>
          </SelectContent>
        </Select>

        <span className="tabular text-[0.72rem] text-muted-foreground sm:ml-auto">
          {filtered.length} of {items.length}
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((key) => (
            <div key={key} className="paper-panel space-y-3 p-4">
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="paper-panel flex flex-col items-center px-6 py-14 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <Bookmark className="h-5 w-5" />
          </span>
          <h2 className="display-title mt-4 text-lg">
            {items.length === 0 ? "Nothing saved yet" : "Nothing matches those filters"}
          </h2>
          <p className="mt-1.5 max-w-sm text-[0.8rem] leading-relaxed text-muted-foreground">
            {items.length === 0
              ? "Search the boards and hit Save job on anything worth a contact."
              : "Try another status or board to see the rest of your shortlist."}
          </p>
          {items.length === 0 ? (
            <Button asChild className="mt-5 h-9 rounded-full px-5 text-[0.8rem]">
              <Link to="/job-search">
                <Search className="h-3.5 w-3.5" />
                Search job boards
              </Link>
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => (
            <SavedJobCard
              key={job.id}
              job={job}
              converting={convertingId === job.id}
              onStatusChange={changeStatus}
              onConvert={convertToApplication}
              onDelete={setPendingDelete}
            />
          ))}
        </div>
      )}

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(next) => !next && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this saved job?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `${pendingDelete.title} at ${pendingDelete.company} will be removed from your shortlist.`
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