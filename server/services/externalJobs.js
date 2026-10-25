const axios = require("axios");

const CACHE_TTL_MS = 15 * 60 * 1000;
let cache = { expiresAt: 0, jobs: [] };

function isFutureDate(value) {
  if (!value) return true;
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time > Date.now();
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
  const description = job.description || job.excerpt || "";

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
    description: description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || job.excerpt || "Open the original listing for full details.",
    skillsRequired: Array.isArray(job.categories) ? job.categories : [],
    employmentType: job.employmentType || "",
    seniority: Array.isArray(job.seniority) ? job.seniority.join(", ") : job.seniority || "",
    salary: job.minSalary || job.maxSalary
      ? [job.minSalary, job.maxSalary].filter((value) => value != null).join("–") + ` ${job.currency || ""} / ${job.salaryPeriod || "annual"}`
      : "",
    postedAt: job.pubDate ? new Date(Number(job.pubDate) * 1000).toISOString() : null,
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
    description: "Open the original listing for the full job description, requirements and application instructions.",
    skillsRequired: [],
    employmentType: job.employmentType || "",
    seniority: "",
    salary,
    postedAt: job.postedAt || null,
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

  const jobs = results
    .filter((result) => result.status === "fulfilled")
    .flatMap((result) => result.value);

  const unique = new Map();
  for (const job of jobs) unique.set(job._id, job);

  const sorted = [...unique.values()].sort((a, b) => {
    const dateA = a.postedAt ? new Date(a.postedAt).getTime() : 0;
    const dateB = b.postedAt ? new Date(b.postedAt).getTime() : 0;
    return dateB - dateA;
  });

  // Cache even an empty result briefly to avoid hammering external providers.
  cache = { expiresAt: Date.now() + CACHE_TTL_MS, jobs: sorted };
  return sorted;
}

module.exports = { getExternalJobs };
