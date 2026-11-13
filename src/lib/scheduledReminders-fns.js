import { checkReminder } from "@/lib/reminder-fns";

export async function checkScheduledReminders() {
  return checkReminder();
}
