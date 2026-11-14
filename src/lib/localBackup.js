const STORAGE_PREFIX = "lonestar_worklog_";
const FORMAT = "lonestar-worklog-backup";
const VERSION = 1;

export function createLocalBackup() {
  const collections = {};
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key?.startsWith(STORAGE_PREFIX)) continue;
    const name = key.slice(STORAGE_PREFIX.length);
    try {
      collections[name] = JSON.parse(localStorage.getItem(key) || "null");
    } catch {
      // Keep the rest of the backup usable if an old collection is malformed.
    }
  }
  return {
    format: FORMAT,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    collections,
  };
}

export function restoreLocalBackup(backup, mode = "merge") {
  if (!backup || backup.format !== FORMAT || !backup.collections || typeof backup.collections !== "object") {
    throw new Error("This file is not a LoneStar WorkLog backup.");
  }
  const entries = Object.entries(backup.collections);
  if (!entries.length) throw new Error("The backup does not contain any saved records.");
  for (const [name, records] of entries) {
    if (!/^[a-zA-Z0-9_-]+$/.test(name) || !Array.isArray(records)) {
      throw new Error("The backup contains an invalid collection.");
    }
  }

  for (const [name, records] of entries) {
    const key = STORAGE_PREFIX + name;
    if (mode === "replace") {
      localStorage.setItem(key, JSON.stringify(records));
      continue;
    }
    let current = [];
    try {
      current = JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      current = [];
    }
    const byId = new Map(current.map((item) => [item.id, item]));
    records.forEach((item) => {
      if (item?.id) byId.set(item.id, item);
    });
    localStorage.setItem(key, JSON.stringify([...byId.values()]));
  }
  return entries.length;
}

export function downloadLocalBackup() {
  const blob = new Blob([JSON.stringify(createLocalBackup(), null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `lonestar-worklog-backup-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
