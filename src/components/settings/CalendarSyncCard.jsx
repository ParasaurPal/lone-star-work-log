import { useEffect, useState } from "react";
import { localStore } from "@/api/localStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyCalendarFeed, rotateCalendarFeed } from "@/lib/calendarFeed-fns";
import { buildInterviewFeed } from "@/lib/ics";
import { CalendarPlus, Check, Copy, Download, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function CalendarSyncCard() {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getMyCalendarFeed()
      .then((result) => setToken(result.token))
      .catch(() => toast.error("Couldn't load your calendar ID."))
      .finally(() => setLoading(false));
  }, []);

  const downloadIcs = async () => {
    setExporting(true);
    try {
      const interviews = await localStore.entities.Interview.list("-interview_date_time", 500);
      const icsContent = buildInterviewFeed(interviews);
      const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "lonestar-worklog-interviews.ics";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${interviews.length} interview(s) to .ics`);
    } catch {
      toast.error("Couldn't export calendar file.");
    } finally {
      setExporting(false);
    }
  };

  const copyToken = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Select the ID and copy it manually.");
    }
  };

  const rotate = async () => {
    setRotating(true);
    try {
      const result = await rotateCalendarFeed();
      setToken(result.token);
      toast.success("New local calendar ID generated");
    } catch {
      toast.error("Couldn't create a new ID.");
    } finally {
      setRotating(false);
    }
  };

  return (
    <section className="paper-panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[0.95rem] font-semibold tracking-tight">Calendar export & sync</h2>
          <p className="text-[0.75rem] text-muted-foreground">
            Export your logged interviews as an .ics file to import into Proton Calendar or Google Calendar.
          </p>
        </div>
        <CalendarPlus className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
      </div>

      {loading ? (
        <div className="mt-4 space-y-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              className="h-9 gap-1.5 rounded-full px-4 text-[0.8rem]"
              onClick={downloadIcs}
              disabled={exporting}
            >
              {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Download .ics calendar file
            </Button>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Input readOnly value={token || ""} className="text-[0.78rem]" aria-label="Local calendar feed ID" />
            <Button
              type="button"
              variant="outline"
              className="h-9 shrink-0 gap-1.5 rounded-full px-4 text-[0.8rem]"
              onClick={copyToken}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy ID"}
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-4">
            <p className="text-[0.7rem] text-muted-foreground">
              All interview records stay stored locally on your device.
            </p>
            <Button
              type="button"
              variant="ghost"
              className="h-8 gap-1.5 rounded-full px-3 text-[0.75rem]"
              onClick={rotate}
              disabled={rotating}
            >
              {rotating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Rotate ID
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
