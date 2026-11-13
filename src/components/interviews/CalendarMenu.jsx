import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CalendarPlus } from "lucide-react";
import {
  downloadIcs,
  googleCalendarUrl,
  outlookCalendarUrl,
} from "@/lib/calendarLinks";
import { toast } from "sonner";

export default function CalendarMenu({ interview, variant = "outline", label = "Sync to calendar" }) {
  const google = googleCalendarUrl(interview);
  const outlook = outlookCalendarUrl(interview);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size="sm" className="h-8 gap-1.5 rounded-full px-3 text-[0.72rem]">
          <CalendarPlus className="h-3.5 w-3.5" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild disabled={!google}>
          <a href={google || "#"} target="_blank" rel="noreferrer">
            Google Calendar
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild disabled={!outlook}>
          <a href={outlook || "#"} target="_blank" rel="noreferrer">
            Outlook
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            downloadIcs(interview);
            toast.success("Calendar file downloaded");
          }}
        >
          Apple / other (.ics)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}