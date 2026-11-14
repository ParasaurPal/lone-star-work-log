const STORAGE_PREFIX = "lonestar_worklog_";

const LOCAL_USER = {
  id: "local-user-1",
  email: "",
  full_name: "Local workspace",
  role: "admin",
};

function readCollection(name) {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + name);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeCollection(name, items) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_PREFIX + name, JSON.stringify(items));
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
      if (limit) items = items.slice(0, limit);
      return items;
    },
    async filter(query = {}, options = {}) {
      let items = readCollection(name).filter((item) => matchesQuery(item, query));
      if (options.sort) items = sortItems(items, options.sort);
      if (options.limit) items = items.slice(0, options.limit);
      return items;
    },
    async count(query = {}) {
      return readCollection(name).filter((item) => matchesQuery(item, query)).length;
    },
    async create(payload) {
      const items = readCollection(name);
      const now = new Date().toISOString();
      const record = {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        created_date: now,
        updated_date: now,
        ...payload,
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
        updated_date: new Date().toISOString(),
      };
      writeCollection(name, items);
      return items[idx];
    },
    async delete(id) {
      const items = readCollection(name).filter((item) => item.id !== id);
      writeCollection(name, items);
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
      UploadPrivateFile: async ({ file }) => ({
        file_url: typeof URL !== "undefined" ? URL.createObjectURL(file) : "",
        file_name: file?.name ?? "screenshot.png",
      }),
      CreateFileSignedUrl: async ({ file_url }) => ({ signed_url: file_url }),
      InvokeLLM: async () => {
        throw new Error("Cloud OCR/LLM disabled in offline mode. Enter details manually.");
      },
      SendEmail: async () => ({ success: true }),
    },
  },
};
