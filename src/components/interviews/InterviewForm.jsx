import { useEffect, useState } from "react";
import { localStore } from "@/api/localStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toDateTimeInput } from "@/lib/format";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const EMPTY = {
  company_name: "",
  position_title: "",
  company_location: "",
  interview_date_time: "",
  callback_time_frame: "",
  notes: "",
  application_id: "",
};

export default function InterviewForm({ open, onOpenChange, interview, initial, onSaved }) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const source = interview
      ? { ...EMPTY, ...interview, interview_date_time: toDateTimeInput(interview.interview_date_time) }
      : { ...EMPTY, ...(initial || {}) };
    if (source.interview_date_time) source.interview_date_time = toDateTimeInput(source.interview_date_time);
    setValues(source);
    setErrors({});
  }, [open, interview, initial]);

  const set = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!values.company_name?.trim()) next.company_name = "Add the company name.";
    if (!values.position_title?.trim()) next.position_title = "Add the position.";
    if (!values.interview_date_time) next.interview_date_time = "When is the interview?";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      const payload = {
        company_name: values.company_name.trim(),
        position_title: values.position_title.trim(),
        company_location: values.company_location?.trim() || "",
        interview_date_time: new Date(values.interview_date_time).toISOString(),
        callback_time_frame: values.callback_time_frame?.trim() || "",
        notes: values.notes?.trim() || "",
        application_id: values.application_id || "",
      };
      if (interview?.id) {
        await localStore.entities.Interview.update(interview.id, payload);
        toast.success("Interview updated");
      } else {
        await localStore.entities.Interview.create(payload);
        toast.success("Interview saved");
      }
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast.error("That didn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="display-title text-xl">
            {interview ? "Edit interview" : "New interview"}
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="company_name" className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Company
            </Label>
            <Input
              id="company_name"
              value={values.company_name}
              placeholder="Gulf Coast Logistics"
              onChange={(event) => set("company_name", event.target.value)}
            />
            {errors.company_name ? (
              <p className="text-[0.72rem] font-medium text-destructive">{errors.company_name}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="position_title" className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Position
            </Label>
            <Input
              id="position_title"
              value={values.position_title}
              placeholder="Operations Coordinator"
              onChange={(event) => set("position_title", event.target.value)}
            />
            {errors.position_title ? (
              <p className="text-[0.72rem] font-medium text-destructive">{errors.position_title}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="interview_date_time" className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Date & time
            </Label>
            <Input
              id="interview_date_time"
              type="datetime-local"
              value={values.interview_date_time}
              onChange={(event) => set("interview_date_time", event.target.value)}
            />
            {errors.interview_date_time ? (
              <p className="text-[0.72rem] font-medium text-destructive">{errors.interview_date_time}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="company_location" className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Interview location
            </Label>
            <Input
              id="company_location"
              value={values.company_location}
              placeholder="1200 Congress Ave, Austin, TX"
              onChange={(event) => set("company_location", event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="callback_time_frame" className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Callback time frame
            </Label>
            <Input
              id="callback_time_frame"
              value={values.callback_time_frame}
              placeholder="Within 48 hours"
              onChange={(event) => set("callback_time_frame", event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Notes
            </Label>
            <Textarea
              id="notes"
              rows={3}
              value={values.notes}
              placeholder="Interviewer name, what to bring, parking…"
              onChange={(event) => set("notes", event.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              className="h-9 rounded-full px-4 text-[0.8rem]"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="h-9 rounded-full px-5 text-[0.8rem]" disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {interview ? "Save changes" : "Save interview"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}