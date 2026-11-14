import { localStore } from "@/api/localStore";
import { isoDate, weekEndingSaturday } from "@/lib/twcWeeks";

function centralNow(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  })
    .formatToParts(date)
    .reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});
  return {
    weekday: parts.weekday,
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
  };
}

export async function sendTestReminder({ data = {} } = {}) {
  const weekEnd = isoDate(weekEndingSaturday());
  const goal = data?.goal ?? 5;
  const logged = await localStore.entities.JobApplication.count({ twc_week_ending: weekEnd });

  await localStore.entities.NotificationLog.create({
    sent_at: new Date().toISOString(),
    notification_type: "Weekly_Search_Reminder",
    status: "Sent",
  });

  return { logged, goal };
}

export async function checkReminder() {
  const now = centralNow(new Date());
  const weekEnd = isoDate(weekEndingSaturday());

  const settingsPage = await localStore.entities.NotificationSettings.list();
  const settings = Array.isArray(settingsPage) ? settingsPage[0] : settingsPage?.items?.[0];
  const goal = Number(settings?.weekly_search_goal || 5);
  const logged = await localStore.entities.JobApplication.count({ twc_week_ending: weekEnd });

  if (!settings || settings.enabled === false) {
    return { due: false, sent: false, logged, goal, weekEnd };
  }

  const dueDay = String(settings.reminder_day || "Friday").toLowerCase() === now.weekday.toLowerCase();
  const prefHour = Number(String(settings.reminder_time || "09:00").slice(0, 2));
  const due = dueDay && now.hour >= prefHour;

  if (!due) {
    return { due: false, sent: false, logged, goal, weekEnd };
  }

  const todays = await localStore.entities.NotificationLog.filter({
    notification_type: "Weekly_Search_Reminder",
  });
  const alreadySentToday = todays.some((entry) => String(entry.sent_at || "").startsWith(now.date));

  if (alreadySentToday) {
    return { due: true, sent: false, logged, goal, weekEnd };
  }

  await localStore.entities.NotificationLog.create({
    sent_at: new Date().toISOString(),
    notification_type: "Weekly_Search_Reminder",
    status: "Sent",
  });

  return { due: true, sent: true, logged, goal, weekEnd };
}
