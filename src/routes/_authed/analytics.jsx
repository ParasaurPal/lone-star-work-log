import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PageIntro from "@/components/PageIntro";
import { Skeleton } from "@/components/ui/skeleton";
import { useApplications, useInterviews, useNotificationSettings } from "@/lib/useLogData";
import { METHOD_OPTIONS } from "@/components/appNav";
import { isoDate, shiftWeek, weekEndingSaturday } from "@/lib/twcWeeks";
import { formatDate, percent } from "@/lib/format";
import { BarChart3 } from "lucide-react";

export const Route = createFileRoute("/_authed/analytics")({
  head: () => ({ meta: [{ title: "Analytics — LoneStar WorkLog" }] }),
  component: AnalyticsPage,
});

const RESPONDED = ["Interviewing", "Offer Received", "Rejected"];
const PIE_COLORS = ["#B0451B", "#2E5A7D", "#8C6B3F", "#3F7A5E", "#7A4B6B"];

function AnalyticsPage() {
  const { items, loading } = useApplications();
  const { items: interviews } = useInterviews();
  const { settings } = useNotificationSettings();
  const goal = Number(settings?.weekly_search_goal || 5);

  const stats = useMemo(() => {
    const total = items.length;
    const linkedIds = new Set(interviews.map((i) => i.application_id).filter(Boolean));
    const responded = items.filter((item) => RESPONDED.includes(item.status) || linkedIds.has(item.id));
    const interviewed = items.filter(
      (item) => item.status === "Interviewing" || item.status === "Offer Received" || linkedIds.has(item.id),
    );
    const offers = items.filter((item) => item.status === "Offer Received");

    const gaps = interviews
      .filter((interview) => interview.application_id)
      .map((interview) => {
        const app = items.find((item) => item.id === interview.application_id);
        if (!app?.date_applied) return null;
        const applied = new Date(`${app.date_applied}T00:00:00`).getTime();
        const seen = new Date(interview.interview_date_time).getTime();
        if (Number.isNaN(applied) || Number.isNaN(seen)) return null;
        return Math.max(0, Math.round((seen - applied) / 86400000));
      })
      .filter((value) => value !== null);

    return {
      total,
      responseRate: percent(responded.length, total),
      conversion: percent(interviewed.length, total),
      offers: offers.length,
      avgDays: gaps.length ? Math.round(gaps.reduce((sum, v) => sum + v, 0) / gaps.length) : 0,
      responded: responded.length,
    };
  }, [items, interviews]);

  const weekly = useMemo(() => {
    const current = weekEndingSaturday();
    return Array.from({ length: 8 }, (_, index) => {
      const weekEnd = isoDate(shiftWeek(current, index - 7));
      return {
        label: formatDate(weekEnd, { month: "short", day: "numeric", year: undefined }),
        count: items.filter((item) => item.twc_week_ending === weekEnd).length,
      };
    });
  }, [items]);

  const funnel = useMemo(() => {
    const total = items.length || 1;
    const stages = [
      { name: "Applied", value: items.length },
      { name: "Interviewing", value: items.filter((i) => i.status === "Interviewing" || i.status === "Offer Received").length },
      { name: "Offer", value: items.filter((i) => i.status === "Offer Received").length },
      {
        name: "Closed out",
        value: items.filter((i) => i.status === "Rejected" || i.status === "Ghosted").length,
      },
    ];
    return stages.map((stage) => ({ ...stage, share: percent(stage.value, total) }));
  }, [items]);

  const methods = useMemo(
    () =>
      METHOD_OPTIONS.map((method) => {
        const entries = items.filter((item) => item.application_method === method);
        const responded = entries.filter((item) => RESPONDED.includes(item.status)).length;
        return {
          name: method,
          value: entries.length,
          rate: percent(responded, entries.length),
        };
      }).filter((row) => row.value > 0),
    [items],
  );

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-9 w-56" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageIntro
        eyebrow="Insights"
        title="Analytics"
        description="What your work search is actually producing — response rates, momentum, and which channels work in Texas."
      />

      {items.length === 0 ? (
        <div className="paper-panel flex flex-col items-center px-6 py-14 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <BarChart3 className="h-5 w-5" />
          </span>
          <h2 className="display-title mt-4 text-lg">No data to chart yet</h2>
          <p className="mt-1.5 max-w-sm text-[0.8rem] leading-relaxed text-muted-foreground">
            Log a few applications and your response rate, conversion, and channel performance will
            appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Total applications" value={stats.total} hint="All weeks" />
            <Kpi label="Response rate" value={`${stats.responseRate}%`} hint={`${stats.responded} replied`} />
            <Kpi label="Interview conversion" value={`${stats.conversion}%`} hint={`${stats.offers} offer${stats.offers === 1 ? "" : "s"}`} />
            <Kpi
              label="Avg. days to first response"
              value={stats.avgDays ? `${stats.avgDays}` : "—"}
              hint={stats.avgDays ? "Applied → interview" : "Add an interview to measure"}
            />
          </div>

          <section className="paper-panel p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[0.95rem] font-semibold tracking-tight">Application activity</h2>
              <span className="text-[0.72rem] text-muted-foreground">
                Last 8 TWC weeks · goal {goal}
              </span>
            </div>
            <div className="mt-4 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekly} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke="#8b8779" />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} stroke="#8b8779" />
                  <Tooltip
                    cursor={{ fill: "rgba(176,69,27,0.06)" }}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e6e2d6", fontSize: 12 }}
                  />
                  <ReferenceLine y={goal} stroke="#B0451B" strokeDasharray="4 4" />
                  <Bar dataKey="count" fill="#B0451B" radius={[6, 6, 0, 0]} maxBarSize={38} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="paper-panel p-5">
              <h2 className="text-[0.95rem] font-semibold tracking-tight">Pipeline</h2>
              <p className="text-[0.72rem] text-muted-foreground">Where applications stand today</p>
              <div className="mt-5 space-y-4">
                {funnel.map((stage, index) => (
                  <div key={stage.name}>
                    <div className="flex items-baseline justify-between text-[0.75rem]">
                      <span className="font-medium">{stage.name}</span>
                      <span className="tabular text-muted-foreground">
                        {stage.value} · {stage.share}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full transition-[width] duration-700"
                        style={{
                          width: `${Math.max(stage.share, stage.value > 0 ? 4 : 0)}%`,
                          background: PIE_COLORS[index % PIE_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="paper-panel p-5">
              <h2 className="text-[0.95rem] font-semibold tracking-tight">Contact method effectiveness</h2>
              <p className="text-[0.72rem] text-muted-foreground">Share of contacts and reply rate</p>
              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="h-40 w-full sm:w-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={methods} dataKey="value" nameKey="name" innerRadius={38} outerRadius={64} paddingAngle={2}>
                        {methods.map((entry, index) => (
                          <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e6e2d6", fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="flex-1 space-y-2">
                  {methods.map((method, index) => (
                    <li key={method.name} className="flex items-center justify-between gap-2 text-[0.75rem]">
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: PIE_COLORS[index % PIE_COLORS.length] }}
                        />
                        {method.name}
                      </span>
                      <span className="tabular text-muted-foreground">
                        {method.value} · {method.rate}% reply
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, hint }) {
  return (
    <div className="paper-panel p-4">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="tabular mt-2 text-[1.7rem] font-semibold leading-none">{value}</p>
      <p className="mt-1.5 text-[0.72rem] text-muted-foreground">{hint}</p>
    </div>
  );
}