import { cn } from "@/lib/utils";
import { STATUS_STYLES } from "@/components/appNav";

export default function StatusBadge({ status, className }) {
  const style = STATUS_STYLES[status] || "border-border bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.68rem] font-semibold tracking-wide",
        style,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}