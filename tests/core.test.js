import test from "node:test";
import assert from "node:assert/strict";
process.env.TZ = "America/Los_Angeles";
globalThis.btoa ??= (value) => Buffer.from(value, "binary").toString("base64");
globalThis.atob ??= (value) => Buffer.from(value, "base64").toString("binary");
globalThis.CustomEvent ??= class extends Event {
  constructor(type, options = {}) {
    super(type);
    this.detail = options.detail;
  }
};

class MemoryStorage {
  values = new Map();
  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(String(key), String(value)); }
  removeItem(key) { this.values.delete(key); }
}

const storage = new MemoryStorage();
globalThis.window = {
  localStorage: storage,
  dispatchEvent: () => true,
};

const { isoDate, weekEndingSaturday, weekStartingSunday, shiftWeek, isSaturday } = await import("../src/lib/twcWeeks.js");
const { createEncryptedLocalBackup, decryptLocalBackup, restoreLocalBackup } = await import("../src/lib/localBackup.js");

test("TWC week calculations preserve date-only values in a western timezone", () => {
  assert.equal(isoDate("2026-11-15"), "2026-11-15");
  assert.equal(isoDate(weekEndingSaturday("2026-11-15")), "2026-11-21");
  assert.equal(isSaturday("2026-11-21"), true);
  assert.equal(isSaturday("2026-11-22"), false);
  assert.equal(isoDate(weekStartingSunday("2026-03-14")), "2026-03-08");
  assert.equal(isoDate(shiftWeek("2026-03-14", -1)), "2026-03-07");
});

test("encrypted backups hide record contents and require the correct password", async () => {
  storage.setItem("lonestar_worklog_JobApplication", JSON.stringify([
    { id: "app-1", company_name: "Private Employer" },
  ]));
  const envelope = await createEncryptedLocalBackup("correct horse battery staple");
  assert.equal(envelope.format, "lonestar-worklog-encrypted-backup");
  assert.equal(JSON.stringify(envelope).includes("Private Employer"), false);

  const backup = await decryptLocalBackup(envelope, "correct horse battery staple");
  assert.equal(backup.collections.JobApplication[0].company_name, "Private Employer");
  await assert.rejects(
    () => decryptLocalBackup(envelope, "incorrect password"),
    /password is incorrect or this backup has been damaged/i,
  );
});

test("merge restore updates matching IDs without deleting unrelated local records", () => {
  storage.setItem("lonestar_worklog_JobApplication", JSON.stringify([
    { id: "app-1", company_name: "Old name" },
    { id: "app-local", company_name: "Keep this record" },
  ]));
  const count = restoreLocalBackup({
    format: "lonestar-worklog-backup",
    version: 2,
    collections: {
      JobApplication: [
        { id: "app-1", company_name: "Updated name" },
        { id: "app-2", company_name: "Restored record" },
      ],
    },
  }, "merge");
  const restored = JSON.parse(storage.getItem("lonestar_worklog_JobApplication"));
  assert.equal(count, 1);
  assert.equal(restored.length, 3);
  assert.equal(restored.find((item) => item.id === "app-1").company_name, "Updated name");
  assert.equal(restored.some((item) => item.id === "app-local"), true);
});
