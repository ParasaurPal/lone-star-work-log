import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Star, Plus, Settings } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { checkScheduledReminders } from "@/lib/scheduledReminders-fns";
import { NAV_ITEMS } from "@/components/appNav";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { watchSharedJobs } from "@/lib/shareIntent";
import SharedJobImportDialog from "@/components/jobs/SharedJobImportDialog";

export default function AppShell({ children }) {
  const { user } = useAuth();
  const [sharedJob, setSharedJob] = useState(null);
  const navigate = useNavigate();
  const initials = (user?.full_name || user?.email || "L")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    let active = true;
    let stopListening;
    watchSharedJobs((payload) => {
      if (active) setSharedJob(payload);
    }).then((stop) => {
      stopListening = stop;
      if (!active) stop?.();
    });
    return () => {
      active = false;
      stopListening?.();
    };
  }, []);

  useEffect(() => {
    checkScheduledReminders()
      .then((result) => {
        if (result?.sent) {
          toast.info(`Weekly work-search reminder: ${result.logged} of ${result.goal} contacts logged. Week ending ${result.weekEnd}.`);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
        {/* desktop rail */}
        <aside className="sticky top-0 hidden h-screen flex-col border-r border-border/80 bg-sidebar px-4 py-6 lg:flex">
          <Link to="/" className="flex items-center gap-2.5 px-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Star className="h-4 w-4" fill="currentColor" strokeWidth={0} />
            </span>
            <span className="leading-tight">
              <span className="block text-[0.95rem] font-semibold tracking-tight">LoneStar</span>
              <span className="block text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                WorkLog
              </span>
            </span>
          </Link>

          <nav className="mt-8 flex flex-1 flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.exact }}
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-foreground"
                inactiveProps={{ className: "text-muted-foreground" }}
                activeProps={{ className: "bg-card text-foreground shadow-sm" }}
              >
                <item.icon className="h-4 w-4" strokeWidth={1.9} />
                {item.label}
              </Link>
            ))}
          </nav>

          <Link
            to="/settings"
            className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-foreground"
            inactiveProps={{ className: "text-muted-foreground" }}
            activeProps={{ className: "bg-card text-foreground shadow-sm" }}
          >
            <Settings className="h-4 w-4" strokeWidth={1.9} />
            Settings
          </Link>

          <div className="rounded-2xl border border-border/70 bg-card/70 p-3">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-[0.7rem] font-semibold">
                {initials || "LS"}
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[0.8rem] font-medium">
                  {user?.full_name || "Local workspace"}
                </span>
                <span className="block truncate text-[0.7rem] text-muted-foreground">
                  Saved on this device
                </span>
              </span>
            </div>
          </div>
        </aside>

        {/* main column */}
        <div className="min-w-0">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border/70 bg-background/85 px-4 py-3 backdrop-blur-md lg:hidden">
            <Link to="/" className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Star className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} />
              </span>
              <span className="text-sm font-semibold tracking-tight">LoneStar WorkLog</span>
            </Link>
            <div className="flex items-center gap-1.5">
              <Link
                to="/settings"
                className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground"
                aria-label="Settings"
              >
                <Settings className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => navigate({ to: "/applications" })}
                className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground"
                aria-label="Log an application"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </header>

          <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-5 sm:px-6 lg:px-10 lg:pb-14 lg:pt-9">
            {children}
          </main>
        </div>
      </div>

      {/* mobile tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-background/95 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact }}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.65rem] font-medium"
              inactiveProps={{ className: "text-muted-foreground" }}
              activeProps={{ className: cn("text-primary") }}
            >
              <item.icon className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.9} />
              {item.short || item.label}
            </Link>
          ))}
        </div>
      </nav>
      <SharedJobImportDialog
        open={Boolean(sharedJob)}
        onOpenChange={(open) => !open && setSharedJob(null)}
        shared={sharedJob}
      />
    </div>
  );
}