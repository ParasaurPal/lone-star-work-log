import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { localStore } from "@/api/localStore";
import PageIntro from "@/components/PageIntro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useNotificationLogs,
  useNotificationSettings,
} from "@/lib/useLogData";
import CalendarSyncCard from "@/components/settings/CalendarSyncCard";
import BackupRestoreCard from "@/components/settings/BackupRestoreCard";
import { sendTestReminder } from "@/lib/reminder-fns";
import { formatDateTime } from "@/lib/format";
import { BellRing, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authed/settings")({
  head: () => ({ meta: [{ title: "Settings — LoneStar WorkLog" }] }),
  component: SettingsPage,
});

const CHANNELS = [
  { value: "Push", label: "In-app only", hint: "Shown when you open LoneStar WorkLog" },
];

const NOTIFICATION_LABELS = {
  Weekly_Search_Reminder: "Weekly search reminder",
  TWC_Filing_Deadline_Alert: "Filing deadline alert",
  Daily_Log_Reminder: "Daily log reminder",
  Payment_Request_Reminder: "Payment request reminder",
};

function SettingsPage() {
  const { settings, loading, reload } = useNotificationSettings();
  const { items: logs, loading: logsLoading, reload: reloadLogs } = useNotificationLogs();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        notification_channel: "Push",
        reminder_day: settings.reminder_day || "Friday",
        reminder_time: (settings.reminder_time || "09:00").slice(0, 5),
        enabled: settings.enabled !== false,
        weekly_search_goal: Number(settings.weekly_search_goal || 5),
      });
    }
  }, [settings]);

  const save = async () => {
    if (!settings?.id || !form) return;
    setSaving(true);
    try {
      await localStore.entities.NotificationSettings.update(settings.id, {
        ...form,
        weekly_search_goal: Number(form.weekly_search_goal) || 5,
      });
      toast.success("Reminder settings saved");
      reload();
    } catch (err) {
      toast.error("That didn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    setTesting(true);
    try {
      const result = await sendTestReminder({
        data: {
          goal: Number(form?.weekly_search_goal || 5),
          appUrl: typeof window === "undefined" ? undefined : window.location.origin,
        },
      });
      toast.success(`Test reminder saved on this device. ${result.logged} contacts logged this week.`);
      reloadLogs();
    } catch (err) {
      toast.error("The local test reminder couldn't be saved.");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageIntro
        eyebrow="Preferences"
        title="Settings"
        description="Choose when your on-device reminder appears, and how many searches you hold yourself to each week."
      />

      {loading || !form ? (
        <div className="paper-panel space-y-4 p-5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-2/3" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="paper-panel space-y-5 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[0.95rem] font-semibold tracking-tight">Weekly reminder</h2>
                <p className="text-[0.75rem] text-muted-foreground">
                  Sent in Central Time, while your benefit week is still open.
                </p>
              </div>
              <Switch
                checked={form.enabled}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, enabled: checked }))}
                aria-label="Enable reminders"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Channel
                </Label>
                <Select
                  value={form.notification_channel}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, notification_channel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNELS.map((channel) => (
                      <SelectItem key={channel.value} value={channel.value}>
                        {channel.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[0.7rem] text-muted-foreground">
                  {CHANNELS.find((c) => c.value === form.notification_channel)?.hint}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Reminder day
                </Label>
                <Select
                  value={form.reminder_day}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, reminder_day: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Friday", "Saturday", "Sunday"].map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reminder_time" className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Reminder time
                </Label>
                <Input
                  id="reminder_time"
                  type="time"
                  value={form.reminder_time}
                  onChange={(event) => setForm((prev) => ({ ...prev, reminder_time: event.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="goal" className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Weekly search goal
                </Label>
                <Input
                  id="goal"
                  type="number"
                  min={1}
                  max={10}
                  value={form.weekly_search_goal}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, weekly_search_goal: event.target.value }))
                  }
                />
                <p className="text-[0.7rem] text-muted-foreground">
                  TWC typically asks for 3–5 contacts a week.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-border/70 pt-4">
              <Button className="h-9 rounded-full px-5 text-[0.8rem]" onClick={save} disabled={saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Save settings
              </Button>
              <Button
                variant="outline"
                className="h-9 gap-1.5 rounded-full px-4 text-[0.8rem]"
                onClick={test}
                disabled={testing}
              >
                {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BellRing className="h-3.5 w-3.5" />}
                Send test reminder
              </Button>
            </div>

            <div className="space-y-2 border-t border-border/70 pt-4">
              <h3 className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Automatic nudges
              </h3>
              <ul className="space-y-1.5 text-[0.78rem]">
                <li className="flex items-center justify-between gap-3 rounded-xl bg-secondary/50 px-3 py-2">
                  <span>Log your work search activity</span>
                  <span className="tabular shrink-0 text-muted-foreground">Daily · 9:15 PM</span>
                </li>
                <li className="flex items-center justify-between gap-3 rounded-xl bg-secondary/50 px-3 py-2">
                  <span>Request your weekly payment</span>
                  <span className="tabular shrink-0 text-muted-foreground">Wednesday · 6:15 PM</span>
                </li>
              </ul>
            </div>

            <p className="rounded-xl bg-secondary/60 px-3.5 py-3 text-[0.72rem] leading-relaxed text-muted-foreground">
              Times are Central. Reminders are checked locally when you open LoneStar WorkLog at
              or after the scheduled time. No account or email delivery is required.
            </p>
          </section>

          <section className="paper-panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[0.95rem] font-semibold tracking-tight">Reminder history</h2>
              <BellRing className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
            </div>

            {logsLoading ? (
              <div className="mt-4 space-y-2">
                {[0, 1, 2].map((key) => (
                  <Skeleton key={key} className="h-12 rounded-xl" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-8 text-center text-[0.78rem] text-muted-foreground">
                No reminders logged yet. Use the test reminder to check your local reminder history.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {logs.map((log) => (
                  <li
                    key={log.id}
                    className="flex items-start justify-between gap-2 rounded-xl border border-border/70 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[0.78rem] font-medium">
                        {NOTIFICATION_LABELS[log.notification_type] || "Reminder"}
                      </p>
                      <p className="text-[0.7rem] text-muted-foreground">
                        {formatDateTime(log.sent_at)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${
                        log.status === "Failed"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {log.status === "Failed" ? (
                        <AlertCircle className="h-3 w-3" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                      {log.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          </div>

          <BackupRestoreCard />
          <CalendarSyncCard />
        </div>
      )}
    </div>
  );
}