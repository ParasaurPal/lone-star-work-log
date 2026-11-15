const STORAGE_PREFIX = "lonestar_worklog_";
const FORMAT = "lonestar-worklog-backup";
const ENCRYPTED_FORMAT = "lonestar-worklog-encrypted-backup";
const VERSION = 2;
const PBKDF2_ITERATIONS = 310000;

function storage() {
  if (typeof window === "undefined" || !window.localStorage) {
    throw new Error("Local storage is unavailable in this browser.");
  }
  return window.localStorage;
}

function collectCollections() {
  const source = storage();
  const collections = {};
  for (let index = 0; index < source.length; index += 1) {
    const key = source.key(index);
    if (!key?.startsWith(STORAGE_PREFIX)) continue;
    const name = key.slice(STORAGE_PREFIX.length);
    try {
      collections[name] = JSON.parse(source.getItem(key) || "null");
    } catch {
      throw new Error(`The local "${name}" collection is damaged. Export cannot continue safely.`);
    }
  }
  return collections;
}

export function createLocalBackup() {
  return {
    format: FORMAT,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    collections: collectCollections(),
  };
}

function validateBackup(backup) {
  if (!backup || ![FORMAT, ENCRYPTED_FORMAT].includes(backup.format) ||
      !backup.collections || typeof backup.collections !== "object" ||
      Array.isArray(backup.collections)) {
    throw new Error("This file is not a valid LoneStar WorkLog backup.");
  }
  const entries = Object.entries(backup.collections);
  if (!entries.length) throw new Error("The backup does not contain any saved records.");
  for (const [name, records] of entries) {
    if (!/^[a-zA-Z0-9_-]+$/.test(name) || !Array.isArray(records) ||
        records.some((record) => !record || typeof record !== "object" || Array.isArray(record))) {
      throw new Error("The backup contains an invalid collection or record.");
    }
  }
  return entries;
}

function passwordBytes(password) {
  return new TextEncoder().encode(password.normalize("NFKC"));
}

async function deriveKey(password, salt) {
  const material = await crypto.subtle.importKey(
    "raw", passwordBytes(password), "PBKDF2", false, ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function createEncryptedLocalBackup(password) {
  if (typeof password !== "string" || password.length < 12) {
    throw new Error("Use a backup password with at least 12 characters.");
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const payload = new TextEncoder().encode(JSON.stringify(createLocalBackup()));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, payload);
  const toBase64 = (bytes) => btoa(String.fromCharCode(...bytes));
  return {
    format: ENCRYPTED_FORMAT,
    version: VERSION,
    cipher: "AES-256-GCM",
    kdf: "PBKDF2-SHA-256",
    iterations: PBKDF2_ITERATIONS,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(ciphertext)),
    exportedAt: new Date().toISOString(),
  };
}

export async function decryptLocalBackup(envelope, password) {
  if (!envelope || envelope.format !== ENCRYPTED_FORMAT ||
      envelope.cipher !== "AES-256-GCM" || envelope.kdf !== "PBKDF2-SHA-256" ||
      envelope.iterations !== PBKDF2_ITERATIONS ||
      !envelope.salt || !envelope.iv || !envelope.ciphertext) {
    throw new Error("This encrypted backup format is not supported.");
  }
  if (!password) throw new Error("Enter the backup password.");
  const fromBase64 = (value) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
  try {
    const key = await deriveKey(password, fromBase64(envelope.salt));
    const cleartext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(envelope.iv) },
      key,
      fromBase64(envelope.ciphertext),
    );
    const backup = JSON.parse(new TextDecoder().decode(cleartext));
    validateBackup(backup);
    return backup;
  } catch (error) {
    if (error?.message?.includes("backup")) throw error;
    throw new Error("The password is incorrect or this backup has been damaged.");
  }
}

export function restoreLocalBackup(backup, mode = "merge") {
  const entries = validateBackup(backup);
  if (!["merge", "replace"].includes(mode)) throw new Error("Choose a valid restore mode.");
  const source = storage();
  const changes = [];
  for (const [name, records] of entries) {
    const key = STORAGE_PREFIX + name;
    let next = records;
    if (mode === "merge") {
      let current = [];
      try {
        current = JSON.parse(source.getItem(key) || "[]");
      } catch {
        throw new Error(`Your existing "${name}" data is damaged. Restore was stopped without changing it.`);
      }
      if (!Array.isArray(current)) throw new Error(`Your existing "${name}" collection is invalid.`);
      const byId = new Map(current.map((item, index) => [item?.id || `legacy-${index}`, item]));
      records.forEach((item, index) => {
        byId.set(item.id || `backup-${index}`, item);
      });
      next = [...byId.values()];
    }
    changes.push({ key, next: JSON.stringify(next), previous: source.getItem(key) });
  }

  const applied = [];
  try {
    for (const change of changes) {
      source.setItem(change.key, change.next);
      applied.push(change);
    }
  } catch (error) {
    for (const change of applied.reverse()) {
      if (change.previous === null) source.removeItem(change.key);
      else source.setItem(change.key, change.previous);
    }
    throw new Error("There isn't enough device storage to complete this restore. No partial restore was kept.");
  }
  window.dispatchEvent(new CustomEvent("lonestar-worklog:storage-changed"));
  return entries.length;
}

export async function readBackupFile(file, password) {
  if (!file || file.size > 50 * 1024 * 1024) {
    throw new Error("Choose a backup file smaller than 50 MB.");
  }
  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error("The selected file isn't valid JSON.");
  }
  if (parsed?.format === ENCRYPTED_FORMAT) return decryptLocalBackup(parsed, password);
  return parsed;
}

export async function downloadLocalBackup(password) {
  const backup = await createEncryptedLocalBackup(password);
  const filename = `lonestar-worklog-encrypted-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const file = typeof File !== "undefined"
    ? new File([blob], filename, { type: "application/json" })
    : null;

  // Android's native share sheet lets the user choose any installed storage app
  // without granting this app access to that provider or storing provider tokens.
  if (file && typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: "LoneStar WorkLog encrypted backup",
      text: "Encrypted with your backup password. Store the file and password separately.",
    });
    return "shared";
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "downloaded";
}
