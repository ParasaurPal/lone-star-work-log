import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import WeekHeader from "@/components/dashboard/WeekHeader";
import ComplianceCard from "@/components/dashboard/ComplianceCard";
import StatCard from "@/components/dashboard/StatCard";
import ActivityList from "@/components/dashboard/ActivityList";
import UpcomingInterviews from "@/components/dashboard/UpcomingInterviews";
import FiledWeekStatus from "@/components/dashboard/FiledWeekStatus";
import AuditReportButton from "@/components/dashboard/AuditReportButton";
import InterviewCalendar from "@/components/dashboard/InterviewCalendar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/AuthContext";
import { useApplications, useInterviews, useNotificationSettings } from "@/lib/useLogData";
import { checkReminder } from "@/lib/reminder-fns";
import { formatDateTime } from "@/lib/format";
import {
  daysLeftInWeek,
  isoDate,
  shiftWeek,
  weekEndingSaturday,
  weekRangeLabel,
  weekStartingSunday,
  shortDate,
} from "@/lib/twcWeeks";

export const Route = createFileRoute("/_authed/")({
  head: () => ({ meta: [{ title: "Dashboard — LoneStar WorkLog" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const [weekEnding, setWeekEnding] = useState(() => isoDate(weekEndingSaturday()));
  const { items, loading, reload } = useApplications();
  const { items: interviews, loading: interviewsLoading, reload: reloadInterviews } = useInterviews();
  const { settings } = useNotificationSettings();

  useEffect(() => {
    checkReminder().catch(() => {});
  }, []);

  const goal = Number(settings?.weekly_search_goal || 5);

  const weekEntries = useMemo(() => {
    return items
      .filter((item) => item.twc_week_ending === weekEnding)
      .sort((a, b) => (a.date_applied < b.date_applied ? 1 : -1))
      .map((item) => ({
        ...item,
        dayLabel: shortDate(item.date_applied),
      }));
  }, [items, weekEnding]);

  const weeksLogged = useMemo(
    () => new Set(items.map((item) => item.twc_week_ending).filter(Boolean)).size,
    [items],
  );

  const upcoming = useMemo(() => {
    const now = Date.now();
    return interviews
      .filter((interview) => new Date(interview.interview_date_time).getTime() >= now)
      .slice(0, 3)
      .map((interview) => ({
        id: interview.id,
        company_name: interview.company_name,
        position_title: interview.position_title,
        when: formatDateTime(interview.interview_date_time),
      }));
  }, [interviews]);

  const isCurrentWeek = weekEnding === isoDate(weekEndingSaturday());
  const reminderLabel = settings
    ? `${settings.reminder_day || "Friday"} at ${(settings.reminder_time || "09:00").slice(0, 5)}`
    : "Friday at 09:00";

  const currentWeekLogged = useMemo(() => {
    const current = isoDate(weekEndingSaturday());
    return items.filter((item) => item.twc_week_ending === current).length;
  }, [items]);

  const centralWeekday = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "America/Chicago",
  });
  const showNudge =
    settings?.enabled !== false &&
    settings?.notification_channel !== "Email" &&
    centralWeekday === (settings?.reminder_day || "Friday") &&
    currentWeekLogged < goal;

  return (
    <div className="space-y-6">
      <WeekHeader
        name={user?.full_name}
        weekLabel={weekRangeLabel(weekEnding)}
        onPrev={() => setWeekEnding(isoDate(shiftWeek(weekEnding, -1)))}
        onNext={() => setWeekEnding(isoDate(shiftWeek(weekEnding, 1)))}
        onToday={() => setWeekEnding(isoDate(weekEndingSaturday()))}
        extraActions={
          <AuditReportButton entries={weekEntries} weekEnding={weekEnding} goal={goal} />
        }
      />

      {showNudge ? (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/25 bg-primary/[0.06] px-4 py-3">
          <p className="text-[0.8rem] font-medium text-foreground">
            Reminder: you have {currentWeekLogged} of {goal} work searches logged this week.
          </p>
          <Button asChild className="h-8 rounded-full px-3.5 text-[0.75rem]">
            <Link to="/applications">Update work log now</Link>
          </Button>
        </section>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <ComplianceCard
            logged={weekEntries.length}
            goal={goal}
            rangeLabel={weekRangeLabel(weekEnding)}
            daysLeft={isCurrentWeek ? daysLeftInWeek(weekEnding) : 0}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary/60 px-4 py-3">
              <p className="text-[0.78rem] text-muted-foreground">
                {weekEntries.length >= goal
                  ? "Your record is complete for this week — export it before filing."
                  : "TWC counts every contact, not just applications. Log them as you go."}
              </p>
              <Button asChild className="h-8 rounded-full px-3.5 text-[0.75rem]">
                <Link to="/applications">Log a contact</Link>
              </Button>
            </div>
          </ComplianceCard>

          <FiledWeekStatus
            weekEnding={weekEnding}
            logged={weekEntries.length}
            goal={goal}
          />

          <section className="paper-panel p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[0.95rem] font-semibold tracking-tight">
                Week of {weekEnding ? shortDate(weekStartingSunday(weekEnding)) : ""}
              </h2>
              <span className="tabular text-[0.72rem] text-muted-foreground">
                {weekEntries.length} {weekEntries.length === 1 ? "activity" : "activities"}
              </span>
            </div>
            <div className="mt-4">
              {loading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((key) => (
                    <Skeleton key={key} className="h-14 rounded-xl" />
                  ))}
                </div>
              ) : (
                <ActivityList entries={weekEntries} />
              )}
            </div>
          </section>
        </div>

        <div className="space-y-5">
          {loading ? (
            <Skeleton className="h-[11.5rem] rounded-[1.6rem]" />
          ) : (
            <StatCard
              title="Work search activities"
              hint="Logged across every week"
              value={items.length}
              details={[
                { label: "Weeks", value: weeksLogged },
                { label: "Weekly goal", value: `${goal} searches` },
              ]}
            />
          )}

          {interviewsLoading ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : (
            <UpcomingInterviews items={upcoming} />
          )}

          <section className="paper-panel p-5">
            <h2 className="text-[0.95rem] font-semibold tracking-tight">Reminder</h2>
            <p className="mt-1 text-[0.78rem] text-muted-foreground">
              {settings?.enabled === false
                ? "Reminders are switched off. Turn them on to keep your weeks filed on time."
                : `You'll be nudged every ${reminderLabel} while the week is still open.`}
            </p>
            <Button
              asChild
              variant="outline"
              className="mt-4 h-8 rounded-full px-3.5 text-[0.75rem]"
            >
              <Link to="/settings">Change schedule</Link>
            </Button>
          </section>
        </div>
      </div>

      <InterviewCalendar interviews={interviews} />

      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild variant="outline" className="h-9 rounded-full px-4 text-[0.8rem]">
          <Link to="/export">Export TWC log</Link>
        </Button>
        {items.length > 0 ? (
          <Button
            variant="ghost"
            className="h-9 rounded-full px-4 text-[0.8rem]"
            onClick={() => {
              reload();
              reloadInterviews();
            }}
          >
            Refresh
          </Button>
        ) : null}
      </div>
    </div>
  );
}