import { useEffect, useState } from "react";
import { localStore } from "@/api/localStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { METHOD_OPTIONS, STATUS_OPTIONS } from "@/components/appNav";
import { todayInput } from "@/lib/format";
import { isoDate, weekEndingSaturday } from "@/lib/twcWeeks";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const EMPTY = {
  date_applied: "",
  company_name: "",
  position_title: "",
  job_location: "",
  application_method: "Online",
  contact_info: "",
  status: "Applied",
  twc_week_ending: "",
  notes: "",
};

export default function ApplicationForm({ open, onOpenChange, application, initial, onSaved }) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const base = application
      ? { ...EMPTY, ...application }
      : {
          ...EMPTY,
          date_applied: todayInput(),
          twc_week_ending: isoDate(weekEndingSaturday()),
          ...(initial || {}),
        };
    if (!base.twc_week_ending && base.date_applied) {
      base.twc_week_ending = isoDate(weekEndingSaturday(base.date_applied));
    }
    setValues(base);
    setErrors({});
  }, [open, application, initial]);

  const set = (field, value) => {
    setValues((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "date_applied" && value) {
        next.twc_week_ending = isoDate(weekEndingSaturday(value));
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!values.date_applied) next.date_applied = "Pick the date you applied.";
    if (!values.company_name?.trim()) next.company_name = "Who did you contact?";
    if (!values.position_title?.trim()) next.position_title = "What position did you apply for?";
    if (!values.job_location?.trim()) next.job_location = "Add a city/state, or type Remote.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        date_applied: values.date_applied,
        company_name: values.company_name.trim(),
        position_title: values.position_title.trim(),
        job_location: values.job_location.trim(),
        application_method: values.application_method,
        contact_info: values.contact_info?.trim() || "",
        status: values.status,
        twc_week_ending:
          values.twc_week_ending || isoDate(weekEndingSaturday(values.date_applied)),
        notes: values.notes?.trim() || "",
      };
      if (application?.id) {
        await localStore.entities.JobApplication.update(application.id, payload);
        toast.success("Application updated");
      } else {
        await localStore.entities.JobApplication.create(payload);
        toast.success("Application logged");
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
            {application ? "Edit application" : "Log a work search"}
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date of contact" error={errors.date_applied} htmlFor="date_applied">
              <Input
                id="date_applied"
                type="date"
                value={values.date_applied}
                onChange={(event) => set("date_applied", event.target.value)}
              />
            </Field>
            <Field
              label="TWC week ending"
              hint="Saturdays only"
              htmlFor="twc_week_ending"
            >
              <Input
                id="twc_week_ending"
                type="date"
                value={values.twc_week_ending}
                onChange={(event) => set("twc_week_ending", event.target.value)}
              />
            </Field>
          </div>

          <Field label="Company / business" error={errors.company_name} htmlFor="company_name">
            <Input
              id="company_name"
              value={values.company_name}
              placeholder="Bluebonnet Health Systems"
              onChange={(event) => set("company_name", event.target.value)}
            />
          </Field>

          <Field label="Position applied for" error={errors.position_title} htmlFor="position_title">
            <Input
              id="position_title"
              value={values.position_title}
              placeholder="Registered Nurse II"
              onChange={(event) => set("position_title", event.target.value)}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Location" error={errors.job_location} htmlFor="job_location">
              <Input
                id="job_location"
                value={values.job_location}
                placeholder="Austin, TX or Remote"
                onChange={(event) => set("job_location", event.target.value)}
              />
            </Field>
            <Field label="Contact method" htmlFor="application_method">
              <Select
                value={values.application_method}
                onValueChange={(value) => set("application_method", value)}
              >
                <SelectTrigger id="application_method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHOD_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact person / details" htmlFor="contact_info">
              <Input
                id="contact_info"
                value={values.contact_info}
                placeholder="Name, email, phone, or website"
                onChange={(event) => set("contact_info", event.target.value)}
              />
            </Field>
            <Field label="Result" htmlFor="status">
              <Select value={values.status} onValueChange={(value) => set("status", value)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Notes" htmlFor="notes">
            <Textarea
              id="notes"
              rows={3}
              value={values.notes}
              placeholder="Job posting number, who you spoke with, next steps…"
              onChange={(event) => set("notes", event.target.value)}
            />
          </Field>

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
              {application ? "Save changes" : "Log application"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, hint, error, htmlFor, children }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && !error ? <p className="text-[0.7rem] text-muted-foreground">{hint}</p> : null}
      {error ? <p className="text-[0.72rem] font-medium text-destructive">{error}</p> : null}
    </div>
  );
}