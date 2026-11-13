import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { useFiledWeeks } from "@/lib/useLogData";
import { downloadTwcPdf } from "@/lib/twcPdf";
import { weekRangeLabel } from "@/lib/twcWeeks";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

/** Downloads the audit-ready PDF for the week on screen in one click. */
export default function AuditReportButton({ entries = [], weekEnding, goal = 5 }) {
  const { user } = useAuth();
  const { items: filedWeeks } = useFiledWeeks();
  const [working, setWorking] = useState(false);

  const filed = useMemo(
    () => filedWeeks.filter((week) => week.week_ending === weekEnding),
    [filedWeeks, weekEnding],
  );

  const download = () => {
    setWorking(true);
    try {
      downloadTwcPdf(
        {
          entries,
          filedWeeks: filed,
          claimant: { name: user?.full_name || "Claimant", email: user?.email || "" },
          rangeLabel: weekRangeLabel(weekEnding),
          goal,
        },
        `twc-audit-report-${weekEnding || "log"}.pdf`,
      );
      toast.success("Audit report downloaded");
    } catch (err) {
      toast.error("We couldn't build that PDF. Please try again.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="h-9 gap-1.5 rounded-full px-4 text-[0.8rem]"
      onClick={download}
      disabled={working}
    >
      {working ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
      Download audit report
    </Button>
  );
}