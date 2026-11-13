import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { localStore } from "@/api/localStore";
import PageIntro from "@/components/PageIntro";
import JobSearchForm from "@/components/jobs/JobSearchForm";
import JobResultCard from "@/components/jobs/JobResultCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { searchJobs } from "@/lib/jobSearch-fns";
import { useSavedJobs } from "@/lib/useSavedJobs";
import { Bookmark, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authed/job-search")({
  head: () => ({ meta: [{ title: "Job Search — LoneStar WorkLog" }] }),
  component: JobSearchPage,
});

const EMPTY_FORM = {
  keywords: "",
  location: "",
  radius: 0,
  salaryMin: 0,
  jobType: "any",
  level: "any",
  remoteOnly: false,
  datePosted: "30",
};

function JobSearchPage() {
  const { items: savedJobs, reload: reloadSaved } = useSavedJobs();
  const [form, setForm] = useState(EMPTY_FORM);
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [savingKey, setSavingKey] = useState(null);

  const savedKeys = useMemo(
    () => new Set(savedJobs.map((job) => job.job_key)),
    [savedJobs],
  );

  const runSearch = async () => {
    setSearching(true);
    try {
      const response = await searchJobs({ data: form });
      setResults(response);
      if (response.jobs.length === 0) toast.info("No listings matched those filters.");
    } catch (error) {
      toast.error(error?.message || "Couldn't reach the job boards. Try again.");
    } finally {
      setSearching(false);
    }
  };

  const saveJob = async (job) => {
    if (savedKeys.has(job.job_key)) {
      toast.info("That job is already saved.");
      return;
    }
    setSavingKey(job.job_key);
    try {
      await localStore.entities.SavedJob.create({
        job_key: job.job_key,
        title: job.title,
        company: job.company,
        location: job.location,
        salary: job.salary,
        type: job.type,
        level: job.level,
        source: job.source,
        source_label: job.source_label,
        url: job.url,
        posted_at: job.posted_at || undefined,
        description: job.description,
        status: "saved",
      });
      toast.success(`Saved “${job.title}” at ${job.company}`);
      reloadSaved();
    } catch (error) {
      toast.error("Couldn't save that job.");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageIntro
        eyebrow="Job sweep"
        title="Job Search"
        description="Search several boards at once, de-duplicated. Save the ones worth a contact and they land in your saved list."
        actions={
          <Button asChild variant="outline" className="h-9 gap-1.5 rounded-full px-4 text-[0.8rem]">
            <Link to="/saved-jobs">
              <Bookmark className="h-3.5 w-3.5" />
              Saved jobs ({savedJobs.length})
            </Link>
          </Button>
        }
      />

      <JobSearchForm form={form} onChange={setForm} onSubmit={runSearch} searching={searching} />

      {searching ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((key) => (
            <div key={key} className="paper-panel space-y-3 p-4">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          ))}
        </div>
      ) : !results ? (
        <div className="paper-panel flex flex-col items-center px-6 py-14 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <Search className="h-5 w-5" />
          </span>
          <h2 className="display-title mt-4 text-lg">Sweep the boards in one pass</h2>
          <p className="mt-1.5 max-w-sm text-[0.8rem] leading-relaxed text-muted-foreground">
            Try a title like “warehouse lead” or “customer service” and set your filters. We pull from
            several boards, remove duplicates, and keep the shape consistent so saving works the same
            everywhere.
          </p>
        </div>
      ) : results.jobs.length === 0 ? (
        <div className="paper-panel px-6 py-12 text-center">
          <h2 className="display-title text-lg">No listings matched</h2>
          <p className="mx-auto mt-1.5 max-w-sm text-[0.8rem] leading-relaxed text-muted-foreground">
            Widen the distance, drop the minimum salary, or try a broader keyword.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[0.78rem] text-muted-foreground">
              {results.jobs.length} {results.jobs.length === 1 ? "listing" : "listings"}
              {results.sources.length ? (
                <>
                  {" · "}
                  {results.sources.map((source) => `${source.label} ${source.count}`).join(" · ")}
                </>
              ) : null}
            </p>
            {results.errors.length ? (
              <p className="text-[0.72rem] text-muted-foreground">
                {results.errors.join(", ")} didn't respond — showing the rest.
              </p>
            ) : null}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {results.jobs.map((job) => (
              <JobResultCard
                key={job.job_key}
                job={job}
                saved={savedKeys.has(job.job_key)}
                saving={savingKey === job.job_key}
                onSave={saveJob}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}