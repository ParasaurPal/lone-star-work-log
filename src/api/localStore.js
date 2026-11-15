const STORAGE_PREFIX = "lonestar_worklog_";

const LOCAL_USER = {
  id: "local-user-1",
  email: "",
  full_name: "Local workspace",
  role: "admin",
};

function notifyStorageChanged(name) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("lonestar-worklog:storage-changed", { detail: { collection: name } }));
}

function readCollection(name) {
  if (typeof window === "undefined") return [];
  const key = STORAGE_PREFIX + name;
  let raw;
  try {
    raw = window.localStorage.getItem(key);
  } catch (error) {
    throw new Error("LoneStar WorkLog cannot access this device's storage. Check browser storage permissions and available space.");
  }
  if (raw === null) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Collection is not an array");
    return parsed;
  } catch {
    throw new Error(`The local "${name}" records could not be read. Your original data was left untouched; export or recover a backup before continuing.`);
  }
}

function writeCollection(name, items) {
  if (typeof window === "undefined") throw new Error("Local storage is unavailable.");
  try {
    window.localStorage.setItem(STORAGE_PREFIX + name, JSON.stringify(items));
  } catch (error) {
    if (error?.name === "QuotaExceededError" || error?.code === 22) {
      throw new Error("Device storage is full. Export a backup or free space before saving more records.");
    }
    throw new Error("Your changes could not be saved to device storage.");
  }
  notifyStorageChanged(name);
}

function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function sortItems(items, sortStr) {
  if (!sortStr) return items;
  const desc = sortStr.startsWith("-");
  const field = desc ? sortStr.slice(1) : sortStr;
  return [...items].sort((a, b) => {
    const av = a?.[field] ?? "";
    const bv = b?.[field] ?? "";
    if (av < bv) return desc ? 1 : -1;
    if (av > bv) return desc ? -1 : 1;
    return 0;
  });
}

function matchesQuery(item, query = {}) {
  return Object.entries(query).every(([key, val]) => {
    if (val === undefined || val === null) return true;
    return item?.[key] === val;
  });
}

function createEntityStore(name) {
  return {
    async list(sort, limit) {
      let items = sortItems(readCollection(name), sort);
      if (Number.isInteger(limit) && limit >= 0) items = items.slice(0, limit);
      return items;
    },
    async filter(query = {}, options = {}) {
      let items = readCollection(name).filter((item) => matchesQuery(item, query));
      if (options.sort) items = sortItems(items, options.sort);
      if (Number.isInteger(options.limit) && options.limit >= 0) items = items.slice(0, options.limit);
      return items;
    },
    async count(query = {}) {
      return readCollection(name).filter((item) => matchesQuery(item, query)).length;
    },
    async create(payload) {
      const items = readCollection(name);
      const now = new Date().toISOString();
      const record = {
        ...payload,
        id: makeId(),
        created_date: now,
        updated_date: now,
      };
      items.unshift(record);
      writeCollection(name, items);
      return record;
    },
    async update(id, payload) {
      const items = readCollection(name);
      const idx = items.findIndex((item) => item.id === id);
      if (idx === -1) throw new Error(`${name} record ${id} not found`);
      items[idx] = {
        ...items[idx],
        ...payload,
        id: items[idx].id,
        updated_date: new Date().toISOString(),
      };
      writeCollection(name, items);
      return items[idx];
    },
    async delete(id) {
      const items = readCollection(name);
      const next = items.filter((item) => item.id !== id);
      if (next.length !== items.length) writeCollection(name, next);
      return { success: true };
    },
  };
}

const entities = new Proxy(
  {},
  {
    get(_, entityName) {
      return createEntityStore(String(entityName));
    },
  }
);

export const localStore = {
  entities,
  asServiceRole: { entities },
  auth: {
    hasToken: () => true,
    setToken: () => {},
    me: async () => LOCAL_USER,
    logout: () => {},
    redirectToLogin: () => {},
    loginWithProvider: async () => LOCAL_USER,
    register: async () => ({ user: LOCAL_USER }),
    verifyOtp: async () => ({ user: LOCAL_USER }),
    resendOtp: async () => ({ success: true }),
    resetPasswordRequest: async () => ({ success: true }),
    resetPassword: async () => ({ success: true }),
  },
  integrations: {
    Core: {
      UploadPrivateFile: async ({ file }) => {
        if (!file) throw new Error("Choose a file first.");
        return {
          file_url: typeof URL !== "undefined" ? URL.createObjectURL(file) : "",
          file_name: file.name || "screenshot",
          file_type: file.type || "application/octet-stream",
        };
      },
      CreateFileSignedUrl: async ({ file_url }) => ({ signed_url: file_url }),
      InvokeLLM: async () => {
        throw new Error("Cloud OCR is unavailable in offline mode. Enter the details manually.");
      },
      SendEmail: async () => {
        throw new Error("Email delivery is not configured in this offline-first app.");
      },
    },
  },
};
