import { useEffect, useMemo, useState } from "react";
import { localStore } from "@/api/localStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { isoDate, weekEndingSaturday } from "@/lib/twcWeeks";
import { toast } from "sonner";
import { Loader2, Briefcase, Link2 } from "lucide-react";

const today = () => {
  const now = new Date();
  return isoDate(now);
};

function parseShared(payload) {
  const text = [payload?.subject, payload?.text].filter(Boolean).join("\n").trim();
  const url = text.match(/https?:\/\/[^\s<>"']+/i)?.[0]?.replace(/[),.;]+$/, "") || "";
  const withoutUrl = text.replace(url, "").split("\n").map((line) => line.trim()).filter(Boolean);
  return {
    title: payload?.subject?.trim() || withoutUrl[0] || "",
    company: "",
    location: "",
    url,
    sourceText: text,
  };
}

export default function SharedJobImportDialog({ open, onOpenChange, shared }) {
  const parsed = useMemo(() => parseShared(shared), [shared]);
  const [values, setValues] = useState(parsed);
  const [dateApplied, setDateApplied] = useState(today());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(parsed);
      setDateApplied(today());
    }
  }, [open, parsed]);

  const set = (field, value) => setValues((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!values.title.trim() || !values.company.trim() || !dateApplied) {
      toast.error("Add the position, company, and application date.");
      return;
    }
    setSaving(true);
    try {
      const existingApps = values.url
        ? await localStore.entities.JobApplication.filter({ job_posting_url: values.url })
        : [];
      if (existingApps.length) {
        toast.info("This posting is already in your application tracker.");
        onOpenChange(false);
        return;
      }

      const application = await localStore.entities.JobApplication.create({
        date_applied: dateApplied,
        company_name: values.company.trim(),
        position_title: values.title.trim(),
        job_location: values.location.trim() || "Not specified",
        application_method: "Online",
        contact_info: values.url,
        job_posting_url: values.url,
        status: "Applied",
        twc_week_ending: isoDate(weekEndingSaturday(dateApplied)),
        notes: "Shared from another app and marked as applied.\n\n" + values.sourceText,
      });

      if (values.url) {
        const saved = await localStore.entities.SavedJob.filter({ url: values.url });
        if (saved.length) {
          await localStore.entities.SavedJob.update(saved[0].id, {
            status: "applied",
            application_id: application.id,
            date_applied: dateApplied,
          });
        } else {
          await localStore.entities.SavedJob.create({
            title: values.title.trim(),
            company: values.company.trim(),
            location: values.location.trim(),
            url: values.url,
            source: "shared",
            source_label: "Shared posting",
            status: "applied",
            application_id: application.id,
            date_applied: dateApplied,
          });
        }
      }
      toast.success("Application logged for " + dateApplied);
      onOpenChange(false);
    } catch {
      toast.error("Couldn't log that application. Your shared posting is still available to retry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Briefcase className="h-5 w-5" />
          </div>
          <DialogTitle className="display-title text-xl">Log shared job as applied</DialogTitle>
          <DialogDescription>
            Review the details and choose the date you submitted your application. It will be added to your work-search record.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="shared-title">Position title</Label>
            <Input id="shared-title" value={values.title} onChange={(e) => set("title", e.target.value)} placeholder="Job title" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shared-company">Company</Label>
            <Input id="shared-company" value={values.company} onChange={(e) => set("company", e.target.value)} placeholder="Company name" required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="shared-location">Location (optional)</Label>
              <Input id="shared-location" value={values.location} onChange={(e) => set("location", e.target.value)} placeholder="City, state or Remote" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shared-date">Date applied</Label>
              <Input id="shared-date" type="date" value={dateApplied} onChange={(e) => setDateApplied(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shared-url">Posting link</Label>
            <div className="relative">
              <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="shared-url" value={values.url} onChange={(e) => set("url", e.target.value)} className="pl-9" placeholder="https://…" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shared-source">Shared text (kept with your record)</Label>
            <Textarea id="shared-source" rows={3} value={values.sourceText} onChange={(e) => set("sourceText", e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" className="rounded-full" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="gap-2 rounded-full" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Briefcase className="h-4 w-4" />}
              Mark as Applied
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
