const SOURCE_LABELS = {
  remotive: "Remotive",
  jobicy: "Jobicy",
  remoteok: "Remote OK",
};

const TYPE_ALIASES = {
  full_time: "full-time",
  "full-time": "full-time",
  "full time": "full-time",
  part_time: "part-time",
  "part-time": "part-time",
  "part time": "part-time",
  contract: "contract",
  contractor: "contract",
  freelance: "contract",
  temporary: "temporary",
  temp: "temporary",
  internship: "internship",
  intern: "internship",
};

const LEVEL_ALIASES = {
  entry: "entry",
  "entry level": "entry",
  junior: "entry",
  internship: "entry",
  mid: "mid",
  "mid level": "mid",
  intermediate: "mid",
  associate: "mid",
  senior: "senior",
  lead: "lead",
  principal: "lead",
  staff: "lead",
  director: "executive",
  executive: "executive",
  "c-level": "executive",
  vp: "executive",
};

const DAY_MS = 24 * 60 * 60 * 1000;

const GENERIC_LOCATIONS = [
  "anywhere",
  "worldwide",
  "remote",
  "usa",
  "u.s.",
  "united states",
  "nationwide",
  "global",
  "americas",
  "north america",
];

export function stripHtml(html = "") {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeType(raw) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return "";
  const key = String(value).trim().toLowerCase();
  return TYPE_ALIASES[key] || "";
}

function normalizeLevel(raw) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return "";
  const key = String(value).trim().toLowerCase();
  return LEVEL_ALIASES[key] || "";
}

function salaryFromRange(min, max, currency) {
  const low = Number(min) || 0;
  const high = Number(max) || 0;
  if (!low && !high) return "";
  const symbol = !currency || String(currency).toUpperCase() === "USD" ? "$" : `${currency} `;
  const fmt = (n) => `${Math.round(n / 1000)}k`;
  if (low && high) return `${symbol}${fmt(low)} – ${symbol}${fmt(high)}`;
  return `${symbol}${fmt(high || low)}+`;
}

function parseSalaryRange(text) {
  const raw = String(text || "").toLowerCase();
  const numbers = raw.replace(/,/g, "").match(/\d+(\.\d+)?/g);
  if (!numbers) return { min: 0, max: 0 };
  const values = numbers.map(Number).filter((n) => n > 0);
  if (!values.length) return { min: 0, max: 0 };
  let scale = 1;
  if (/hour|hr\b/.test(raw)) scale = 2080;
  else if (/month/.test(raw)) scale = 12;
  else if (/week/.test(raw)) scale = 52;
  else if (/day/.test(raw)) scale = 250;
  else if (Math.max(...values) < 1000) scale = 2080;
  const scaled = values.map((n) => Math.round(n * scale));
  return { min: Math.min(...scaled), max: Math.max(...scaled) };
}

async function getJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(9000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function remotiveJobs({ keywords }) {
  const url = new URL("https://remotive.com/api/remote-jobs");
  url.searchParams.set("limit", "50");
  if (keywords) url.searchParams.set("search", keywords);
  const json = await getJson(url.toString());
  return (json.jobs || []).map((job) => {
    const text = stripHtml(job.description);
    const range = parseSalaryRange(job.salary);
    return {
      job_key: `remotive:${job.id}`,
      title: job.title || "",
      company: job.company_name || "",
      location: job.candidate_required_location || "Remote",
      salary: job.salary || "",
      salary_min: range.min,
      salary_max: range.max,
      type: normalizeType(job.job_type),
      level: "",
      source: "remotive",
      source_label: SOURCE_LABELS.remotive,
      url: job.url || "",
      posted_at: job.publication_date || "",
      description: text.slice(0, 6000),
      snippet: text.slice(0, 220),
      remote: true,
    };
  });
}

async function jobicyJobs({ keywords }) {
  const url = new URL("https://jobicy.com/api/v2/remote-jobs");
  url.searchParams.set("count", "50");
  url.searchParams.set("geo", "usa");
  if (keywords) url.searchParams.set("tag", keywords);
  const json = await getJson(url.toString());
  return (json.jobs || []).map((job) => {
    const text = stripHtml(job.jobDescription || job.jobExcerpt);
    const low = Number(job.annualSalaryMin) || 0;
    const high = Number(job.annualSalaryMax) || 0;
    return {
      job_key: `jobicy:${job.id}`,
      title: job.jobTitle || "",
      company: job.companyName || "",
      location: job.jobGeo || "Remote",
      salary: salaryFromRange(low, high, job.salaryCurrency),
      salary_min: low,
      salary_max: high,
      type: normalizeType(job.jobType),
      level: normalizeLevel(job.jobLevel),
      source: "jobicy",
      source_label: SOURCE_LABELS.jobicy,
      url: job.url || "",
      posted_at: job.pubDate || "",
      description: text.slice(0, 6000),
      snippet: (stripHtml(job.jobExcerpt) || text).slice(0, 220),
      remote: true,
    };
  });
}

async function remoteOkJobs({ keywords }) {
  const tag = keywords.split(/\s+/).filter(Boolean)[0];
  const url = tag
    ? `https://remoteok.com/api?tags=${encodeURIComponent(tag)}`
    : "https://remoteok.com/api";
  const json = await getJson(url);
  return (Array.isArray(json) ? json : [])
    .filter((job) => job && job.id && job.position)
    .map((job) => {
      const text = stripHtml(job.description);
      const low = Number(job.salary_min) || 0;
      const high = Number(job.salary_max) || 0;
      const typeTag = (job.tags || []).find((tagValue) =>
        /full.?time|part.?time|contract|intern|temporary/i.test(tagValue)
      );
      return {
        job_key: `remoteok:${job.id}`,
        title: job.position || "",
        company: job.company || "",
        location: job.location || "Remote",
        salary: low || high ? `${salaryFromRange(low, high, "USD")} / yr` : "",
        salary_min: low,
        salary_max: high,
        type: normalizeType(typeTag),
        level: "",
        source: "remoteok",
        source_label: SOURCE_LABELS.remoteok,
        url: job.url || job.apply_url || "",
        posted_at: job.date || "",
        description: text.slice(0, 6000),
        snippet: text.slice(0, 220),
        remote: true,
      };
    });
}

function locationMatches(jobLocation, wanted, radius) {
  if (!wanted) return true;
  const loc = String(jobLocation || "").toLowerCase();
  const needle = wanted.toLowerCase().trim();
  if (!loc) return true;
  if (!radius) return true;
  if (loc.includes(needle)) return true;
  const [city, region] = needle.split(",").map((part) => part.trim()).filter(Boolean);
  const cityMatch = city ? loc.includes(city) : false;
  const regionMatch = region ? loc.includes(region) : false;
  const generic = GENERIC_LOCATIONS.some((word) => loc.includes(word));
  if (radius <= 25) return cityMatch;
  if (radius <= 50) return cityMatch || regionMatch;
  return cityMatch || regionMatch || generic;
}

export async function searchJobs({ data = {} } = {}) {
  const input = {
    keywords: String(data.keywords || ""),
    location: String(data.location || ""),
    radius: Number(data.radius) || 0,
    salaryMin: Number(data.salaryMin) || 0,
    jobType: String(data.jobType || "any"),
    level: String(data.level || "any"),
    remoteOnly: Boolean(data.remoteOnly),
    datePosted: String(data.datePosted || "30"),
  };

  const keywords = input.keywords.trim();
  const params = { keywords };

  const settled = await Promise.allSettled([
    remotiveJobs(params),
    jobicyJobs(params),
    remoteOkJobs(params),
  ]);

  const names = ["Remotive", "Jobicy", "Remote OK"];
  const errors = [];
  let raw = [];
  settled.forEach((result, index) => {
    if (result.status === "fulfilled") raw = raw.concat(result.value);
    else errors.push(names[index]);
  });

  if (raw.length === 0 && errors.length === 3) {
    throw new Error("The job boards aren't responding right now. Check your connection and try again.");
  }

  const tokens = keywords.toLowerCase().split(/\s+/).filter((token) => token.length > 2);
  const cutoffDays = input.datePosted === "any" ? 0 : Number(input.datePosted) || 0;
  const cutoff = cutoffDays ? Date.now() - cutoffDays * DAY_MS : 0;

  const filtered = raw.filter((job) => {
    if (!job.title || !job.url) return false;
    if (tokens.length) {
      const haystack = `${job.title} ${job.company} ${job.description}`.toLowerCase();
      if (!tokens.some((token) => haystack.includes(token))) return false;
    }
    if (input.salaryMin > 0 && job.salary_max && job.salary_max < input.salaryMin) return false;
    if (input.jobType !== "any" && job.type && job.type !== input.jobType) return false;
    if (input.level !== "any" && job.level && job.level !== input.level) return false;
    if (input.remoteOnly && !job.remote) return false;
    if (!locationMatches(job.location, input.location.trim(), input.radius)) return false;
    if (cutoff) {
      const posted = new Date(job.posted_at).getTime();
      if (Number.isFinite(posted) && posted < cutoff) return false;
    }
    return true;
  });

  const byKey = new Set();
  const byCompany = new Set();
  const jobs = [];
  filtered
    .sort((a, b) => new Date(b.posted_at || 0) - new Date(a.posted_at || 0))
    .forEach((job) => {
      if (byKey.has(job.job_key)) return;
      const crossKey = `${job.company} ${job.title}`.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (byCompany.has(crossKey)) return;
      byKey.add(job.job_key);
      byCompany.add(crossKey);
      jobs.push(job);
    });

  const sourceCounts = {};
  jobs.forEach((job) => {
    sourceCounts[job.source] = (sourceCounts[job.source] || 0) + 1;
  });

  return {
    jobs: jobs.slice(0, 120),
    total: jobs.length,
    sources: Object.entries(sourceCounts).map(([source, count]) => ({
      source,
      label: SOURCE_LABELS[source],
      count,
    })),
    errors,
  };
}
