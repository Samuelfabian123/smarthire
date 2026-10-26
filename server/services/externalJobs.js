const axios = require("axios");

const CACHE_TTL_MS = 15 * 60 * 1000;
const FAILURE_RETRY_MS = 60 * 1000;
let cache = { expiresAt: 0, jobs: [] };

function safePostedDate(value, seconds = false) {
  if (value == null || value === "") return null;
  const numeric = Number(value);
  const date = new Date(seconds && Number.isFinite(numeric) ? numeric * 1000 : value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function isFutureDate(value) {
  if (!value) return true;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time > Date.now();
}

function cleanText(value) {
  if (typeof value !== "string") return "";
  return value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/\s+/g, " ").trim();
}

function toSafeJobUrl(value) {
  if (!value) return "";
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : "";
  } catch {
    return "";
  }
}

function normalizeHimalayas(job) {
  const applyUrl = toSafeJobUrl(job.applicationLink);
  if (!job.title || !applyUrl || !isFutureDate(job.expiryDate ? Number(job.expiryDate) * 1000 : null)) {
    return null;
  }

  const restrictions = Array.isArray(job.locationRestrictions)
    ? job.locationRestrictions.map((item) => item?.name).filter(Boolean)
    : [];
  const location = restrictions.length ? restrictions.join(", ") : "Remote · location restrictions may apply";
  const description = cleanText(job.description || job.excerpt || "");

  return {
    _id: `external:himalayas:${job.guid || applyUrl}`,
    externalId: String(job.guid || applyUrl),
    external: true,
    source: "Himalayas",
    sourceUrl: "https://himalayas.app",
    sourceJobUrl: applyUrl,
    applyUrl,
    title: job.title,
    company: job.companyName || "Company not specified",
    companyLogo: toSafeJobUrl(job.companyLogo),
    location,
    description: description || "Open the original listing for full details.",
    skillsRequired: Array.isArray(job.categories)
      ? job.categories.map((item) => typeof item === "string" ? cleanText(item) : cleanText(item?.name || item?.label || "")).filter(Boolean).slice(0, 20)
      : [],
    employmentType: job.employmentType || "",
    seniority: Array.isArray(job.seniority) ? job.seniority.join(", ") : job.seniority || "",
    salary: job.minSalary || job.maxSalary
      ? [job.minSalary, job.maxSalary].filter((value) => value != null).join("–") + ` ${job.currency || ""} / ${job.salaryPeriod || "annual"}`
      : "",
    postedAt: safePostedDate(job.pubDate, true),
    isRemote: true,
  };
}

function normalizeBoqqs(job) {
  const listingUrl = toSafeJobUrl(job.url);
  const applyUrl = toSafeJobUrl(job.applyUrl) || listingUrl;
  if (!job.title || !listingUrl || !isFutureDate(job.expiresAt)) return null;

  const place = job.location || {};
  const location = [place.city, place.region, place.country].filter(Boolean).join(", ") || (job.remote === "remote" ? "Remote" : "Location not specified");
  const salary = job.salary?.display || (
    job.salary?.min != null || job.salary?.max != null
      ? [job.salary?.min, job.salary?.max].filter((value) => value != null).join("–") + ` ${job.salary?.currency || ""} / ${job.salary?.period || "year"}`
      : ""
  );

  return {
    _id: `external:boqqs:${job.id || listingUrl}`,
    externalId: String(job.id || listingUrl),
    external: true,
    source: "BOQQS",
    sourceUrl: listingUrl,
    sourceJobUrl: listingUrl,
    applyUrl,
    title: job.title,
    company: job.employer || "Company not specified",
    companyLogo: "",
    location: job.remote === "remote" ? `Remote · ${location}` : location,
    description: cleanText(job.description || job.excerpt || job.summary || job.descriptionText) || "The source does not provide a full description in its feed. Open the original listing to review the role, requirements and application instructions.",
    skillsRequired: Array.isArray(job.skillsRequired)
      ? job.skillsRequired.filter((skill) => typeof skill === "string" && skill.trim()).slice(0, 20)
      : Array.isArray(job.skills)
        ? job.skills.filter((skill) => typeof skill === "string" && skill.trim()).slice(0, 20)
        : Array.isArray(job.categories)
          ? job.categories.filter((skill) => typeof skill === "string" && skill.trim()).slice(0, 20)
          : [],
    employmentType: job.employmentType || "",
    seniority: "",
    salary,
    postedAt: safePostedDate(job.postedAt),
    isRemote: job.remote === "remote",
  };
}

async function fetchHimalayasJobs() {
  const response = await axios.get("https://himalayas.app/jobs/api", {
    params: { limit: 20 },
    timeout: 12000,
    headers: { "User-Agent": "SmartHireJobDiscovery/1.0" },
  });
  return (Array.isArray(response.data?.jobs) ? response.data.jobs : [])
    .map(normalizeHimalayas)
    .filter(Boolean);
}

async function fetchBoqqsJobs(params) {
  const response = await axios.get("https://boqqs.com/api/v1/jobs", {
    params: { per_page: 50, ...params },
    timeout: 12000,
    headers: { "User-Agent": "SmartHireJobDiscovery/1.0" },
  });
  return (Array.isArray(response.data?.jobs) ? response.data.jobs : [])
    .map(normalizeBoqqs)
    .filter(Boolean);
}

async function getExternalJobs({ forceRefresh = false } = {}) {
  if (!forceRefresh && cache.expiresAt > Date.now()) return cache.jobs;

  const results = await Promise.allSettled([
    fetchHimalayasJobs(),
    fetchBoqqsJobs({ country: "NG" }),
    fetchBoqqsJobs({ remote: "remote" }),
  ]);

  const feedSources = ["Himalayas", "BOQQS", "BOQQS"];
  const successfulFeeds = results.filter((result) => result.status === "fulfilled");
  const hasFailedFeed = successfulFeeds.length !== results.length;

  // If every provider is unavailable, keep serving the last known listings
  // rather than replacing them with an empty page.
  if (successfulFeeds.length === 0) {
    cache.expiresAt = Date.now() + FAILURE_RETRY_MS;
    return cache.jobs;
  }

  // Refresh from healthy feeds while retaining cached jobs from a provider
  // that failed. The short retry window ensures we try the failed provider soon.
  const jobs = results.flatMap((result, index) => {
    if (result.status === "fulfilled") return result.value;
    return cache.jobs.filter((job) => job.source === feedSources[index]);
  });

  // Some providers can return an empty/changed payload without throwing.
  // Don't wipe a useful cache on that response; retry shortly instead.
  if (jobs.length === 0 && cache.jobs.length > 0) {
    cache.expiresAt = Date.now() + FAILURE_RETRY_MS;
    return cache.jobs;
  }

  const unique = new Map();
  for (const job of jobs) unique.set(job._id, job);

  const sorted = [...unique.values()].sort((a, b) => {
    const dateA = a.postedAt ? new Date(a.postedAt).getTime() : 0;
    const dateB = b.postedAt ? new Date(b.postedAt).getTime() : 0;
    return dateB - dateA;
  });

  // Successful responses get a longer cache; an empty response is retried sooner.
  cache = {
    expiresAt: Date.now() + (sorted.length && !hasFailedFeed ? CACHE_TTL_MS : FAILURE_RETRY_MS),
    jobs: sorted,
  };
  return sorted;
}

module.exports = { getExternalJobs };
