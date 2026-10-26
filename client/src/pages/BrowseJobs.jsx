import { useCallback, useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, MapPin, Search, Sparkles, RefreshCw } from "lucide-react";
import api from "../api/axios";

function companyName(job) {
  return job.company || job.employer?.companyName || job.employer?.name || "Hiring employer";
}

function safeExternalUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
}

function cleanDescription(value) {
  return typeof value === "string"
    ? value
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\s+/g, " ")
        .trim()
    : "";
}

function postedLabel(value) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
  if (days === 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  if (days < 30) return `Posted ${days} days ago`;
  return `Posted ${date.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}`;
}

function LoadingRows() {
  return <div className="divide-y divide-[#E7E5DD]">{[1, 2, 3].map((n) => <div key={n} className="animate-pulse p-6"><div className="h-4 w-2/3 rounded bg-[#E7E5DD]" /><div className="mt-3 h-3 w-1/3 rounded bg-[#E7E5DD]" /><div className="mt-5 h-3 w-full max-w-xl rounded bg-[#E7E5DD]" /></div>)}</div>;
}

export default function BrowseJobs() {
  const [jobs, setJobs] = useState([]);
  const [matchingId, setMatchingId] = useState(null);
  const [matchResults, setMatchResults] = useState({});
  const [matchErrors, setMatchErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/jobs");
      setJobs(Array.isArray(data) ? data : Array.isArray(data?.jobs) ? data.jobs : []);
    } catch (err) {
      console.error("Unable to load jobs:", err);
      setError(err.response?.data?.error || "We couldn't load vacancies. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const filteredJobs = useMemo(() => jobs.filter((job) => {
    const query = search.trim().toLowerCase();
    const place = location.trim().toLowerCase();
    const text = [job.title, companyName(job), job.description, job.location, ...(Array.isArray(job.skillsRequired) ? job.skillsRequired : [])].filter(Boolean).join(" ").toLowerCase();
    return (!query || text.includes(query)) &&
      (!place || String(job.location || "").toLowerCase().includes(place)) &&
      (sourceFilter === "all" || (sourceFilter === "external" ? Boolean(job.external) : !job.external));
  }), [jobs, search, location, sourceFilter]);

  const sortedJobs = useMemo(() => [...filteredJobs].sort((a, b) => {
    if (sortBy === "title") return String(a.title || "").localeCompare(String(b.title || ""));
    const dateA = new Date(a.postedAt || a.createdAt || 0).getTime() || 0;
    const dateB = new Date(b.postedAt || b.createdAt || 0).getTime() || 0;
    return dateB - dateA;
  }), [filteredJobs, sortBy]);

  async function matchJob(job) {
    setMatchingId(job._id);
    setMatchErrors((prev) => ({ ...prev, [job._id]: "" }));
    try {
      const response = job.external
        ? await api.post("/matches/external", { title: job.title, description: cleanDescription(job.description), skillsRequired: Array.isArray(job.skillsRequired) ? job.skillsRequired : [] })
        : await api.post(`/matches/job/${job._id}`);
      const result = response.data || {};
      const match = result.match || {};
      const score = result.finalScore ?? match.finalScore;
      if (score === undefined || score === null || !Number.isFinite(Number(score))) throw new Error("The matching service returned an invalid score.");
      setMatchResults((prev) => ({
        ...prev,
        [job._id]: {
          finalScore: Number(score),
          matchedSkills: Array.isArray(result.matchedSkills)
            ? result.matchedSkills.filter((skill) => typeof skill === "string")
            : Array.isArray(match.matchedSkills) ? match.matchedSkills.filter((skill) => typeof skill === "string") : [],
          missingSkills: Array.isArray(result.missingSkills)
            ? result.missingSkills.filter((skill) => typeof skill === "string")
            : Array.isArray(match.missingSkills) ? match.missingSkills.filter((skill) => typeof skill === "string") : [],
        },
      }));
    } catch (err) {
      setMatchErrors((prev) => ({
        ...prev,
        [job._id]: err.response?.data?.error || err.message || "Matching failed. Upload a CV and try again.",
      }));
    } finally {
      setMatchingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F5EE] px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="mb-7 sm:mb-9">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#DCD8CC] bg-white px-3 py-1.5 text-xs font-semibold text-[#2F6F4E]"><Sparkles size={14} /> SMARTER JOB DISCOVERY</span>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><h1 className="font-serif text-3xl leading-tight text-[#16241E] sm:text-4xl">Discover your next opportunity</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#737B76] sm:text-base">Explore vacancies from SmartHire employers and external job sources, then check how your CV aligns with each role.</p></div>
            <p className="shrink-0 text-sm text-[#737B76]" aria-live="polite">{loading ? "Finding jobs…" : `${filteredJobs.length} opportunities`}</p>
          </div>
        </header>

        <section className="mb-6 rounded-2xl border border-[#DCD8CC] bg-white p-4 shadow-sm sm:p-5" aria-label="Search and filter jobs">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="relative block"><span className="sr-only">Search jobs, companies, or skills</span><Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737B76]" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Job title, company, or skill" className="w-full rounded-xl border border-[#DCD8CC] bg-[#FDFCF9] py-3 pl-10 pr-3 text-sm outline-none focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/10" /></label>
            <label className="relative block"><span className="sr-only">Filter by location</span><MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737B76]" /><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location (e.g. Lagos, Remote)" className="w-full rounded-xl border border-[#DCD8CC] bg-[#FDFCF9] py-3 pl-10 pr-3 text-sm outline-none focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/10" /></label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">{[["all", "All vacancies"], ["external", "External jobs"], ["smarthire", "SmartHire employers"]].map(([value, label]) => <button key={value} type="button" aria-pressed={sourceFilter === value} onClick={() => setSourceFilter(value)} className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition ${sourceFilter === value ? "border-[#2F6F4E] bg-[#2F6F4E] text-white" : "border-[#DCD8CC] bg-white text-[#526057] hover:border-[#2F6F4E]"}`}>{label}</button>)}
            <label className="ml-auto flex items-center gap-2 text-xs font-semibold text-[#526057]">Sort<select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-lg border border-[#DCD8CC] bg-white px-3 py-2 text-xs outline-none focus:border-[#2F6F4E]"><option value="newest">Newest first</option><option value="title">Job title A–Z</option></select></label>{(search || location || sourceFilter !== "all") && <button type="button" onClick={() => { setSearch(""); setLocation(""); setSourceFilter("all"); }} className="text-xs font-semibold text-[#2F6F4E] underline">Clear filters</button>}</div>
        </section>

        {error && <div role="alert" className="mb-5 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between"><p>{error}</p><button type="button" onClick={loadJobs} disabled={loading} className="inline-flex items-center gap-2 self-start rounded-lg border border-amber-300 bg-white px-3 py-2 font-semibold disabled:opacity-60"><RefreshCw size={15} /> Try again</button></div>}

        <section className="overflow-hidden rounded-2xl border border-[#DCD8CC] bg-white shadow-sm" aria-label="Available jobs">
          {loading ? <LoadingRows /> : sortedJobs.length ? sortedJobs.map((job) => {
            const description = cleanDescription(job.description);
            const applyUrl = safeExternalUrl(job.applyUrl || job.sourceJobUrl);
            const sourceUrl = safeExternalUrl(job.sourceUrl || job.sourceJobUrl);
            const posted = postedLabel(job.postedAt || job.createdAt);
            const matchResult = matchResults[job._id];
            const score = matchResult?.finalScore;
            return <article key={job._id} className="border-b border-[#E7E5DD] p-5 last:border-b-0 transition-colors hover:bg-[#FDFCF9] sm:p-6"><div className="flex flex-col gap-5 sm:flex-row sm:justify-between">
              <div className="min-w-0 flex-1"><div className="mb-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${job.external ? "bg-blue-50 text-blue-700" : "bg-[#E7F0EA] text-[#2F6F4E]"}`}>{job.external ? "External listing" : "SmartHire job"}</span></div><h2 className="break-words font-serif text-xl text-[#16241E] sm:text-2xl">{job.title || "Untitled vacancy"}</h2><p className="mt-2 text-sm text-[#737B76]">{companyName(job)} · {job.location || "Location not specified"}</p><div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#737B76]">{job.employmentType && <span className="rounded-full border border-[#E7E5DD] px-2.5 py-1">{job.employmentType}</span>}{job.seniority && <span className="rounded-full border border-[#E7E5DD] px-2.5 py-1">{job.seniority}</span>}{job.salary && <span className="rounded-full bg-[#E7F0EA] px-2.5 py-1 font-semibold text-[#2F6F4E]">{job.salary}</span>}{posted && <span>{posted}</span>}</div>{description && <p className="mt-4 max-w-3xl text-sm leading-6 text-[#526057]">{description.length > 240 ? `${description.slice(0, 240).trimEnd()}…` : description}</p>}{Array.isArray(job.skillsRequired) && job.skillsRequired.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{job.skillsRequired.slice(0, 5).map((skill, i) => <span key={`${skill}-${i}`} className="rounded-lg border border-[#E7E5DD] bg-[#FDFCF9] px-2.5 py-1.5 text-xs text-[#526057]">{skill}</span>)}</div>}</div>
              <div className="flex w-full shrink-0 flex-col gap-2 sm:w-44">{score !== undefined ? <div className="rounded-xl border border-[#D5E5D9] bg-[#F1F7F2] px-3 py-2.5 text-center"><p className="text-[11px] font-semibold uppercase text-[#526057]">CV compatibility</p><p className="font-serif text-2xl text-[#2F6F4E]">{Math.round(Math.max(0, Math.min(1, score)) * 100)}%</p><button type="button" onClick={() => matchJob(job)} disabled={matchingId === job._id} className="mt-1 text-xs font-semibold text-[#2F6F4E] underline disabled:opacity-50">Recheck match</button>{matchingId === job._id && <p className="mt-1 text-xs text-[#737B76]">Updating…</p>}</div> : <button type="button" onClick={() => matchJob(job)} disabled={matchingId === job._id} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#2F6F4E] px-3 py-2.5 text-sm font-semibold text-[#2F6F4E] hover:bg-[#E7F0EA] disabled:cursor-wait disabled:opacity-60"><Sparkles size={16} />{matchingId === job._id ? "Checking match…" : "Check AI match"}</button>}{matchErrors[job._id] && <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs leading-5 text-amber-900" role="alert"><p>{matchErrors[job._id]}</p><button type="button" onClick={() => matchJob(job)} disabled={matchingId === job._id} className="mt-1 font-semibold underline">Try matching again</button></div>}{matchResult && ((matchResult.matchedSkills?.length || 0) > 0 || (matchResult.missingSkills?.length || 0) > 0) && <div className="rounded-xl border border-[#E7E5DD] bg-white p-3 text-left">{matchResult.matchedSkills?.length > 0 && <><p className="text-[11px] font-semibold uppercase tracking-wide text-[#2F6F4E]">Skills found</p><div className="mt-2 flex flex-wrap gap-1.5">{matchResult.matchedSkills.slice(0, 6).map((skill) => <span key={`found-${skill}`} className="rounded-full bg-[#E7F0EA] px-2 py-1 text-[11px] text-[#2F6F4E]">{skill}</span>)}</div></>}{matchResult.missingSkills?.length > 0 && <><p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-amber-700">Skills to build</p><div className="mt-2 flex flex-wrap gap-1.5">{matchResult.missingSkills.slice(0, 6).map((skill) => <span key={`missing-${skill}`} className="rounded-full bg-amber-50 px-2 py-1 text-[11px] text-amber-800">{skill}</span>)}</div></>}</div>}
              {job.external ? applyUrl ? <a href={applyUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-[#2F6F4E] px-3 py-2.5 text-center text-sm font-semibold text-white hover:bg-[#234F38]">View / apply ↗</a> : <span className="rounded-xl bg-[#F1F0EA] px-3 py-2.5 text-center text-xs text-[#737B76]">Application link unavailable</span> : <span className="rounded-xl bg-[#F1F0EA] px-3 py-2.5 text-center text-xs text-[#526057]">Apply through SmartHire</span>}{job.external && sourceUrl && <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-center text-xs text-[#737B76] underline underline-offset-4 hover:text-[#2F6F4E]">via {job.source || "original listing"}</a>}</div>
            </div></article>;
          }) : <div className="px-6 py-14 text-center"><BriefcaseBusiness size={28} className="mx-auto text-[#2F6F4E]" /><h2 className="mt-4 font-serif text-xl text-[#16241E]">{jobs.length ? "No jobs match those filters" : "No vacancies available right now"}</h2><p className="mt-2 text-sm leading-6 text-[#737B76]">{jobs.length ? "Try another search or clear your filters to see all vacancies." : "Please check back shortly."}</p><button type="button" onClick={jobs.length ? () => { setSearch(""); setLocation(""); setSourceFilter("all"); } : loadJobs} className="mt-5 rounded-xl bg-[#2F6F4E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#234F38]">{jobs.length ? "Clear filters" : "Refresh vacancies"}</button></div>}
        </section>
        <p className="mt-4 text-xs leading-5 text-[#737B76]">External vacancies are provided by third-party sources. Check the original listing for current availability and application requirements. AI match scores are guidance, not a hiring decision.</p>
      </div>
    </main>
  );
}
