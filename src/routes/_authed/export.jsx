import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import PageIntro from "@/components/PageIntro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/AuthContext";
import { useApplications } from "@/lib/useLogData";
import { downloadTwcPdf } from "@/lib/twcPdf";
import { formatDate, todayInput } from "@/lib/format";
import { isoDate, shiftWeek, weekEndingSaturday, weekRangeLabel } from "@/lib/twcWeeks";
import { FileDown, Loader2, ScrollText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authed/export")({
  head: () => ({ meta: [{ title: "TWC export — LoneStar WorkLog" }] }),
  component: ExportPage,
});

const RANGES = [
  { key: "week", label: "This benefit week" },
  { key: "month", label: "Last 4 weeks" },
  { key: "all", label: "Entire log" },
  { key: "custom", label: "Custom range" },
];

function ExportPage() {
  const { user } = useAuth();
  const { items, loading } = useApplications();
  const [range, setRange] = useState("week");
  const [from, setFrom] = useState(isoDate(shiftWeek(weekEndingSaturday(), -3)));
  const [to, setTo] = useState(todayInput());
  const [claimant, setClaimant] = useState(user?.full_name || "");
  const [working, setWorking] = useState(false);

  const selected = useMemo(() => {
    const sorted = [...items].sort((a, b) => (a.date_applied < b.date_applied ? 1 : -1));
    if (range === "all") return sorted;
    if (range === "week") {
      const weekEnd = isoDate(weekEndingSaturday());
      return sorted.filter((item) => item.twc_week_ending === weekEnd);
    }
    if (range === "month") {
      const start = isoDate(shiftWeek(weekEndingSaturday(), -3));
      return sorted.filter((item) => (item.twc_week_ending || "") >= start);
    }
    if (!from || !to) return sorted;
    return sorted.filter(
      (item) => item.date_applied >= from && item.date_applied <= to,
    );
  }, [items, range, from, to]);

  const rangeLabel =
    range === "custom"
      ? `${formatDate(from)} – ${formatDate(to)}`
      : range === "week"
        ? weekRangeLabel(weekEndingSaturday())
        : range === "month"
          ? "Last 4 TWC weeks"
          : "All logged weeks";

  const generate = async () => {
    setWorking(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 60));
      downloadTwcPdf(
        {
          entries: selected,
          claimant: { name: claimant || user?.full_name || "Claimant", email: user?.email || "" },
          rangeLabel,
          goal: 5,
        },
        `twc-work-search-log-${isoDate(new Date())}.pdf`,
      );
      toast.success("Your TWC log is ready");
    } catch (err) {
      toast.error("We couldn't build that PDF. Please try again.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageIntro
        eyebrow="Audit-ready"
        title="TWC export"
        description="Generate the work search log the Texas Workforce Commission asks for — formatted, dated, and signed."
      />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <section className="paper-panel space-y-5 p-5">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Reporting period
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {RANGES.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setRange(option.key)}
                  className={`rounded-full border px-3.5 py-1.5 text-[0.75rem] font-medium transition-colors ${
                    range === option.key
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {range === "custom" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="from" className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  From
                </Label>
                <Input id="from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="to" className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  To
                </Label>
                <Input id="to" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
              </div>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="claimant" className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Claimant name
            </Label>
            <Input
              id="claimant"
              value={claimant}
              placeholder="Name as it appears on your claim"
              onChange={(event) => setClaimant(event.target.value)}
            />
            <p className="text-[0.7rem] text-muted-foreground">
              Printed in the header and beside the signature line.
            </p>
          </div>

          <div className="rounded-xl bg-secondary/60 px-4 py-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[0.75rem] text-muted-foreground">Contacts included</span>
              <span className="tabular text-lg font-semibold">{selected.length}</span>
            </div>
            <p className="mt-1 text-[0.72rem] text-muted-foreground">{rangeLabel}</p>
          </div>

          <Button
            className="h-10 w-full gap-2 rounded-full text-[0.82rem]"
            onClick={generate}
            disabled={working || selected.length === 0}
          >
            {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            {working ? "Building your PDF…" : "Export TWC Log (PDF)"}
          </Button>
          {selected.length === 0 && !loading ? (
            <p className="text-center text-[0.72rem] font-medium text-destructive">
              No contacts in this period yet — choose another range.
            </p>
          ) : null}
        </section>

        <section className="paper-panel p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[0.95rem] font-semibold tracking-tight">What's on the page</h2>
            <ScrollText className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
          </div>

          {loading ? (
            <div className="mt-5 space-y-3">
              {[0, 1, 2].map((key) => (
                <Skeleton key={key} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {selected.slice(0, 5).map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[0.8rem] font-medium">{entry.company_name}</p>
                    <p className="truncate text-[0.7rem] text-muted-foreground">
                      {entry.position_title} · {formatDate(entry.date_applied)}
                    </p>
                  </div>
                  <span className="shrink-0 text-[0.68rem] font-medium text-muted-foreground">
                    {entry.application_method}
                  </span>
                </li>
              ))}
              {selected.length > 5 ? (
                <li className="px-1 pt-1 text-[0.72rem] text-muted-foreground">
                  + {selected.length - 5} more in the document
                </li>
              ) : null}
              {selected.length === 0 ? (
                <li className="rounded-xl border border-dashed border-border px-3 py-8 text-center text-[0.75rem] text-muted-foreground">
                  Nothing to print for this period yet.
                </li>
              ) : null}
            </ul>
          )}

          <div className="mt-5 space-y-2 border-t border-border/70 pt-4 text-[0.72rem] leading-relaxed text-muted-foreground">
            <p>Includes the TWC header, your claimant details, and the six required audit columns.</p>
            <p>Every page carries a footer with page numbers and a signed certification block.</p>
          </div>
        </section>
      </div>
    </div>
  );
}