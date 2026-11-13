import {
  LayoutDashboard,
  Briefcase,
  CalendarDays,
  BarChart3,
  Settings,
  Download,
  Search,
  Bookmark,
} from "lucide-react";

export const NAV_ITEMS = [
  { to: "/", label: "Dashboard", short: "Home", icon: LayoutDashboard, exact: true },
  { to: "/applications", label: "Applications", short: "Apps", icon: Briefcase },
  { to: "/job-search", label: "Job Search", short: "Search", icon: Search },
  { to: "/saved-jobs", label: "Saved Jobs", short: "Saved", icon: Bookmark },
  { to: "/interviews", label: "Interviews", short: "Interviews", icon: CalendarDays },
  { to: "/analytics", label: "Analytics", short: "Insights", icon: BarChart3 },
  { to: "/export", label: "TWC Export", short: "Export", icon: Download },
];

export const SETTINGS_ITEM = { to: "/settings", label: "Settings", icon: Settings };

export const STATUS_OPTIONS = [
  "Applied",
  "Interviewing",
  "Offer Received",
  "Rejected",
  "Ghosted",
];

export const METHOD_OPTIONS = ["Online", "In-Person", "Email", "Phone", "Recruiter"];

export const STATUS_STYLES = {
  Applied: "border-sky-200 bg-sky-50 text-sky-800",
  Interviewing: "border-amber-200 bg-amber-50 text-amber-900",
  "Offer Received": "border-emerald-200 bg-emerald-50 text-emerald-800",
  Rejected: "border-rose-200 bg-rose-50 text-rose-800",
  Ghosted: "border-stone-200 bg-stone-100 text-stone-600",
};