import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search } from "lucide-react";

const SALARY_OPTIONS = [
  { value: "0", label: "Any salary" },
  { value: "40000", label: "40,000+" },
  { value: "60000", label: "60,000+" },
  { value: "80000", label: "80,000+" },
  { value: "100000", label: "100,000+" },
];

const TYPE_OPTIONS = [
  { value: "any", label: "Any type" },
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "temporary", label: "Temporary" },
  { value: "internship", label: "Internship" },
];

const LEVEL_OPTIONS = [
  { value: "any", label: "Any level" },
  { value: "entry", label: "Entry level" },
  { value: "mid", label: "Mid level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead / Principal" },
  { value: "executive", label: "Executive" },
];

const RADIUS_OPTIONS = [
  { value: "0", label: "Any distance" },
  { value: "25", label: "Within 25 mi" },
  { value: "50", label: "Within 50 mi" },
  { value: "100", label: "Within 100 mi" },
  { value: "200", label: "Within 200 mi" },
];

const DATE_OPTIONS = [
  { value: "1", label: "Past 24 hours" },
  { value: "7", label: "Past week" },
  { value: "30", label: "Past month" },
  { value: "any", label: "Any time" },
];

function Pick({ label, value, options, onChange }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </Label>
      <Select value={String(value)} onValueChange={onChange}>
        <SelectTrigger className="h-9 text-[0.8rem]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} className="text-[0.8rem]">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function JobSearchForm({ form, onChange, onSubmit, searching }) {
  const set = (key) => (value) => onChange({ ...form, [key]: value });

  return (
    <form
      className="paper-panel space-y-3.5 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_9rem]">
        <div className="space-y-1.5">
          <Label className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Keywords
          </Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={form.keywords}
              onChange={(event) => set("keywords")(event.target.value)}
              placeholder="Job title, skill, or company"
              className="h-9 pl-9 text-[0.82rem]"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[0.7rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Location
          </Label>
          <Input
            value={form.location}
            onChange={(event) => set("location")(event.target.value)}
            placeholder="Dallas, TX"
            className="h-9 text-[0.82rem]"
          />
        </div>
        <Pick
          label="Distance"
          value={form.radius}
          options={RADIUS_OPTIONS}
          onChange={(value) => set("radius")(Number(value))}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Pick
          label="Minimum salary"
          value={form.salaryMin}
          options={SALARY_OPTIONS}
          onChange={(value) => set("salaryMin")(Number(value))}
        />
        <Pick label="Job type" value={form.jobType} options={TYPE_OPTIONS} onChange={set("jobType")} />
        <Pick label="Experience" value={form.level} options={LEVEL_OPTIONS} onChange={set("level")} />
        <Pick
          label="Date posted"
          value={form.datePosted}
          options={DATE_OPTIONS}
          onChange={set("datePosted")}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
        <label className="flex items-center gap-2.5 text-[0.8rem] font-medium">
          <Switch
            checked={form.remoteOnly}
            onCheckedChange={(checked) => set("remoteOnly")(checked)}
          />
          Remote only
        </label>
        <Button
          type="submit"
          disabled={searching}
          className="h-9 gap-1.5 rounded-full px-5 text-[0.8rem]"
        >
          {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          {searching ? "Searching boards…" : "Search jobs"}
        </Button>
      </div>
    </form>
  );
}