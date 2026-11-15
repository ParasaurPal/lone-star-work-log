import { useState } from "react";
import { localStore } from "@/api/localStore";
import { Button } from "@/components/ui/button";
import { buildInterviewFeed } from "@/lib/ics";
import { CalendarPlus, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CalendarSyncCard() {
  const [exporting, setExporting] = useState(false);

  const downloadIcs = async () => {
    setExporting(true);
    try {
      const interviews = await localStore.entities.Interview.list("interview_date_time", 1000);
      const icsContent = buildInterviewFeed(interviews);
      const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "lonestar-worklog-interviews.ics";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(`Exported ${interviews.length} interview(s) to an .ics file.`);
    } catch (error) {
      toast.error(error?.message || "Couldn't export the calendar file.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="paper-panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[0.95rem] font-semibold tracking-tight">Calendar export</h2>
          <p className="mt-1 text-[0.75rem] leading-relaxed text-muted-foreground">
            Export your locally stored interviews as a standard .ics calendar file. Import it into Google Calendar, Outlook, Proton Calendar, or another calendar app. This is a one-time export; automatic calendar subscriptions are not enabled in offline mode.
          </p>
        </div>
        <CalendarPlus className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
      </div>
      <Button
        type="button"
        className="mt-4 h-9 gap-1.5 rounded-full px-4 text-[0.8rem]"
        onClick={downloadIcs}
        disabled={exporting}
      >
        {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        {exporting ? "Preparing calendar…" : "Download .ics calendar file"}
      </Button>
    </section>
  );
}
