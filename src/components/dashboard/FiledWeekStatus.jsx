import { useMemo, useState } from "react";
import { localStore } from "@/api/localStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFiledWeeks } from "@/lib/useLogData";
import { formatDate, todayInput } from "@/lib/format";
import { weekRangeLabel } from "@/lib/twcWeeks";
import { CheckCircle2, Circle, Loader2, Undo2 } from "lucide-react";
import { toast } from "sonner";

export default function FiledWeekStatus({ weekEnding, logged, goal }) {
  const { items, loading, reload } = useFiledWeeks();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [values, setValues] = useState({ filed_date: "", confirmation_number: "" });

  const current = useMemo(
    () => items.find((week) => week.week_ending === weekEnding) || null,
    [items, weekEnding],
  );
  const recent = useMemo(
    () => items.filter((week) => week.week_ending !== weekEnding).slice(0, 4),
    [items, weekEnding],
  );

  const ready = logged >= Math.max(1, goal);

  const openDialog = () => {
    setValues({ filed_date: todayInput(), confirmation_number: "" });
    setOpen(true);
  };

  const markFiled = async (event) => {
    event.preventDefault();
    if (!values.filed_date) {
      toast.error("Add the date you filed.");
      return;
    }
    setSaving(true);
    try {
      await localStore.entities.FiledWeek.create({
        week_ending: weekEnding,
        filed_date: values.filed_date,
        confirmation_number: values.confirmation_number.trim(),
      });
      toast.success("Week marked as filed");
      reload();
      setOpen(false);
    } catch (err) {
      toast.error("That didn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const undoFiled = async () => {
    if (!current) return;
    setUndoing(true);
    try {
      await localStore.entities.FiledWeek.delete(current.id);
      toast.success("Filing status cleared");
      reload();
    } catch (err) {
      toast.error("Couldn't clear that week.");
    } finally {
      setUndoing(false);
    }
  };

  return (
    <section className="paper-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[0.95rem] font-semibold tracking-tight">TWC filing status</h2>
          <p className="text-[0.75rem] text-muted-foreground">{weekRangeLabel(weekEnding)}</p>
        </div>
        {loading ? (
          <Skeleton className="h-6 w-20 rounded-full" />
        ) : (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.72rem] font-semibold ${
              current
                ? "bg-emerald-600/10 text-emerald-800"
                : ready
                  ? "bg-amber-500/15 text-amber-900"
                  : "bg-secondary text-muted-foreground"
            }`}
          >
            {current ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
            {current ? "Filed" : ready ? "Ready to file" : "Not filed"}
          </span>
        )}
      </div>

      <p className="mt-3 text-[0.78rem] leading-relaxed text-muted-foreground">
        {current
          ? `Submitted ${formatDate(current.filed_date)}${
              current.confirmation_number ? ` · Confirmation ${current.confirmation_number}` : ""
            }`
          : ready
            ? "Your log meets the weekly requirement — submit it on WorkInTexas, then mark the week filed."
            : "Keep logging contacts, then mark the week once you submit it to TWC."}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {current ? (
          <Button
            variant="outline"
            className="h-8 gap-1.5 rounded-full px-3.5 text-[0.75rem]"
            onClick={undoFiled}
            disabled={undoing}
          >
            {undoing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Undo2 className="h-3.5 w-3.5" />}
            Mark as not filed
          </Button>
        ) : (
          <Button
            className="h-8 gap-1.5 rounded-full px-3.5 text-[0.75rem]"
            onClick={openDialog}
            disabled={loading}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Mark week as filed
          </Button>
        )}
      </div>

      {recent.length > 0 ? (
        <div className="mt-5 border-t border-border/70 pt-4">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Previously filed
          </p>
          <ul className="mt-2 space-y-1.5">
            {recent.map((week) => (
              <li key={week.id} className="flex items-center justify-between gap-2 text-[0.75rem]">
                <span className="truncate text-foreground">{weekRangeLabel(week.week_ending)}</span>
                <span className="shrink-0 text-muted-foreground">{formatDate(week.filed_date)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="display-title text-xl">Mark week as filed</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={markFiled}>
            <p className="text-[0.78rem] text-muted-foreground">
              Recording that you submitted the week ending {formatDate(weekEnding)}.
            </p>
            <div className="space-y-1.5">
              <Label
                htmlFor="filed_date"
                className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
              >
                Date filed
              </Label>
              <Input
                id="filed_date"
                type="date"
                value={values.filed_date}
                onChange={(event) => setValues((prev) => ({ ...prev, filed_date: event.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="confirmation_number"
                className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
              >
                Confirmation number (optional)
              </Label>
              <Input
                id="confirmation_number"
                value={values.confirmation_number}
                placeholder="From your WorkInTexas receipt"
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, confirmation_number: event.target.value }))
                }
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                className="h-9 rounded-full px-4 text-[0.8rem]"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="h-9 rounded-full px-5 text-[0.8rem]" disabled={saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Mark as filed
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}