import { localStore } from "@/api/localStore";

function newToken() {
  return (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())).replace(/-/g, "");
}

async function findFeed() {
  const result = await localStore.entities.CalendarFeed.list("-created_date", 1);
  const items = Array.isArray(result) ? result : result?.items ?? [];
  return items[0] ?? null;
}

export async function getMyCalendarFeed() {
  const existing = await findFeed();
  if (existing) return { token: existing.token };
  const created = await localStore.entities.CalendarFeed.create({ token: newToken(), enabled: true });
  return { token: created.token };
}

export async function rotateCalendarFeed() {
  const existing = await findFeed();
  const token = newToken();
  if (!existing) {
    const created = await localStore.entities.CalendarFeed.create({ token, enabled: true });
    return { token: created.token };
  }
  await localStore.entities.CalendarFeed.update(existing.id, { token });
  return { token };
}
