
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  GraduationCap,
  HeartPulse,
  Mail,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const EMAIL = "smarthire579@gmail.com";
const X_PROFILE = "https://x.com/Smarthire01";

const locations = [
  "Lagos",
  "Abuja",
  "Port Harcourt",
  "Ibadan",
  "Kano",
  "Enugu",
];

const categories = [
  { name: "Technology", icon: BriefcaseBusiness, tone: "emerald" },
  { name: "Finance", icon: WalletCards, tone: "blue" },
  { name: "Marketing", icon: Sparkles, tone: "violet" },
  { name: "Healthcare", icon: HeartPulse, tone: "rose" },
  { name: "Engineering", icon: Building2, tone: "amber" },
  { name: "Education", icon: GraduationCap, tone: "cyan" },
];

const demoJobs = [
  {
    _id: "demo-1",
    title: "Frontend Developer",
    company: "Technology Company",
    location: "Lagos, Nigeria",
    type: "Full-time",
    category: "Technology",
    salary: "Salary not specified",
  },
  {
    _id: "demo-2",
    title: "Financial Analyst",
    company: "Financial Services",
    location: "Abuja, Nigeria",
    type: "Full-time",
    category: "Finance",
    salary: "Salary not specified",
  },
  {
    _id: "demo-3",
    title: "Healthcare Professional",
    company: "Healthcare Organisation",
    location: "Port Harcourt, Nigeria",
    type: "Full-time",
    category: "Healthcare",
    salary: "Salary not specified",
  },
];

function getJobId(job) {
  return job?._id || job?.id || job?.jobId;
}

function getCompanyName(job) {
  return (
    job?.companyName ||
    job?.company?.name ||
    job?.company ||
    "SmartHire Employer"
  );
}

function getLocation(job) {
  return job?.location || job?.city || "Nigeria";
}

function getJobType(job) {
  return job?.type || job?.employmentType || "Employment type not specified";
}

function getSalary(job) {
  if (job?.salary) return job.salary;

  const min = Number(job?.salaryMin || 0);
  const max = Number(job?.salaryMax || 0);

  if (min && max) {
    return `₦${min.toLocaleString()} – ₦${max.toLocaleString()}`;
  }

  if (min || max) {
    return `₦${(min || max).toLocaleString()}`;
  }

  return "Salary not specified";
}

function getCategory(job) {
  return job?.category || job?.industry || job?.jobCategory || "General";
}

function getInitials(name = "") {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "SH"
  );
}

function getTone(tone) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
    rose: "bg-rose-50 text-rose-700 ring-rose-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    cyan: "bg-cyan-50 text-cyan-700 ring-cyan-100",
  };

  return tones[tone] || tones.emerald;
}

function getLogoTone(index) {
  const tones = [
    "bg-slate-900 text-white",
    "bg-emerald-700 text-white",
    "bg-blue-700 text-white",
  ];

  return tones[index % tones.length];
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="mb-8 max-w-2xl">
      {eyebrow && (
        <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">
          {eyebrow}
        </p>
      )}

      <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
        {title}
      </h2>

      {description && (
        <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobLoadFailed, setJobLoadFailed] = useState(false);

  const loadJobs = useCallback(async () => {
    setLoadingJobs(true);

    try {
      const response = await api.get("/jobs");
      const data = response.data;
      const receivedJobs = Array.isArray(data)
        ? data
        : Array.isArray(data?.jobs)
          ? data.jobs
          : [];

      setJobs(receivedJobs);
      setJobLoadFailed(false);
    } catch (error) {
      console.error("Failed to load jobs:", error);
      setJobs([]);
      setJobLoadFailed(true);
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const displayJobs = useMemo(
    () => (jobs.length ? jobs : demoJobs),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    const searchTerm = keyword.trim().toLowerCase();
    const searchCity = location.trim().toLowerCase();

    return displayJobs.filter((job) => {
      const searchable = [
        job?.title,
        getCompanyName(job),
        getCategory(job),
        job?.description,
        getLocation(job),
        ...(Array.isArray(job?.skillsRequired) ? job.skillsRequired : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!searchTerm || searchable.includes(searchTerm)) &&
        (!searchCity || getLocation(job).toLowerCase().includes(searchCity))
      );
    });
  }, [displayJobs, keyword, location]);

  function scrollToJobs() {
    document
      .getElementById("job-results")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleSearch(event) {
    event?.preventDefault();
    scrollToJobs();
  }

  function searchCategory(category) {
    setKeyword(category);
    setLocation("");
    document.getElementById("job-results")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function searchLocation(city) {
    setLocation(city);
    setKeyword("");
    document.getElementById("job-results")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function handleDashboard() {
    if (!user) {
      navigate("/login");
      return;
    }

    navigate(
      user.role === "employer"
        ? "/dashboard/employer"
        : "/dashboard/jobseeker"
    );
  }

  function handlePostJob() {
    if (!user) {
      navigate("/register");
      return;
    }

    if (user.role !== "employer") {
      navigate("/dashboard/jobseeker");
      return;
    }

    navigate("/jobs/new");
  }

  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-900">
      {/* HERO */}
      <section
        id="home"
        className="relative isolate overflow-hidden bg-[#f4faf7]"
      >
        <div className="pointer-events-none absolute -left-32 top-24 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-teal-100/60 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:pb-28 lg:pt-20">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-2 text-xs font-bold text-emerald-800 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Built for the Nigerian job market
            </div>

            <h1 className="text-4xl font-black leading-[1.06] tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-[64px]">
              Your skills deserve
              <span className="block text-emerald-700">
                the right opportunity.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              SmartHire helps job seekers discover relevant opportunities
              and helps employers find talent based on skills, experience,
              and job requirements — not just matching keywords.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={scrollToJobs}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-emerald-800"
              >
                Explore opportunities
                <ArrowRight size={17} />
              </button>

              <button
                type="button"
                onClick={handlePostJob}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 transition hover:border-emerald-300 hover:bg-emerald-50"
              >
                Hire with SmartHire
                <ArrowUpRight size={17} />
              </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs font-medium text-slate-600 sm:text-sm">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-700" />
                Skill-aware matching
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-700" />
                Made for Nigeria
              </span>
            </div>
          </div>

          {/* HERO IMAGE AND MATCH PREVIEW */}
          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div className="relative min-h-[360px] overflow-hidden rounded-[28px] bg-emerald-100 shadow-2xl shadow-emerald-950/10 sm:min-h-[480px] sm:rounded-[36px]">
              <img
                src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=1400&q=85"
                alt="Professional ready to explore new career opportunities"
                className="absolute inset-0 h-full w-full object-cover object-center"
                loading="eager"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-emerald-950/10" />

              <div className="absolute bottom-5 left-5 right-5 text-white sm:bottom-8 sm:left-8 sm:right-8">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-100">
                  Smarter matching. Brighter futures.
                </p>
                <h2 className="mt-2 max-w-sm text-2xl font-black leading-tight sm:text-3xl">
                  Find work that fits who you are.
                </h2>
              </div>
            </div>

            {/* AI match preview */}
            <div className="relative mx-3 -mt-8 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl sm:absolute sm:-left-8 sm:bottom-10 sm:mt-0 sm:w-[285px] sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Sparkles size={21} />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">
                      AI match preview
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Skills-based comparison
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
                  Preview
                </span>
              </div>

              <div className="mt-5 space-y-3">
                <div>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">
                      Relevant skills
                    </span>
                    <span className="text-slate-500">Compared</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-[82%] rounded-full bg-emerald-600" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {["React", "JavaScript", "Node.js"].map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <p className="mt-3 text-[10px] leading-4 text-slate-500">
                Illustrative preview only. Actual compatibility scores depend
                on the resume and job requirements submitted.
              </p>
            </div>

            <div className="absolute right-3 top-4 hidden rounded-2xl border border-white/70 bg-white/95 p-4 shadow-lg backdrop-blur sm:block md:right-0 md:top-10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-slate-900">
                    Built for Nigeria
                  </p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Local talent. Real opportunities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* JOB SEARCH */}
        <div className="relative z-10 mx-auto max-w-5xl px-5 pb-10 sm:px-8 lg:-mt-5">
          <form
            onSubmit={handleSearch}
            className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-900/5 sm:p-4"
          >
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)_auto]">
              <label className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10">
                <Search size={19} className="shrink-0 text-slate-400" />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Job title, skill or company"
                  aria-label="Search by job title, skill or company"
                  autoComplete="off"
                  className="h-12 min-w-0 w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </label>

              <label className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10">
                <MapPin size={19} className="shrink-0 text-slate-400" />
                <select
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  aria-label="Filter by location"
                  className="h-12 min-w-0 w-full appearance-none bg-transparent text-sm text-slate-700 outline-none"
                >
                  <option value="">All locations</option>
                  {locations.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 text-sm font-bold text-white transition hover:bg-emerald-800"
              >
                Search jobs
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <SectionHeading
          eyebrow="Explore careers"
          title="Find your place in the job market"
          description="Explore opportunities across industries and discover roles that fit your skills and ambitions."
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {categories.map(({ name, icon: Icon, tone }) => (
            <button
              key={name}
              type="button"
              onClick={() => searchCategory(name)}
              className="group rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg sm:p-5"
            >
              <div
                className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${getTone(tone)}`}
              >
                <Icon size={21} />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">
                {name}
              </h3>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Explore roles
              </p>
              <ArrowRight
                size={15}
                className="mt-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-700"
              />
            </button>
          ))}
        </div>
      </section>

      {/* FEATURED JOBS */}
      <section
        id="job-results"
        className="scroll-mt-24 border-y border-slate-100 bg-slate-50/70"
      >
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <SectionHeading
              eyebrow="Career opportunities"
              title="Explore featured jobs"
              description={
                keyword || location
                  ? `Showing opportunities matching your selected filters.`
                  : "Discover opportunities from the SmartHire job listings."
              }
            />

            <Link
              to="/jobs"
              className="mb-8 inline-flex items-center gap-2 self-start text-sm font-bold text-emerald-800 transition hover:text-emerald-950 sm:self-auto"
            >
              Browse jobs
              <ArrowRight size={16} />
            </Link>
          </div>

          {loadingJobs ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white"
                />
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
              <Search size={28} className="mx-auto text-slate-400" />
              <h3 className="mt-4 text-lg font-bold text-slate-900">
                No matching jobs found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Try a different keyword or choose another location.
              </p>
              <button
                type="button"
                onClick={() => {
                  setKeyword("");
                  setLocation("");
                }}
                className="mt-5 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              {jobLoadFailed && (
                <div className="mb-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900 sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    We could not load live listings right now. The cards below
                    are illustrative previews, not verified vacancies.
                  </p>
                  <button
                    type="button"
                    onClick={loadJobs}
                    disabled={loadingJobs}
                    className="shrink-0 rounded-lg border border-amber-300 bg-white px-4 py-2 font-bold text-amber-900 transition hover:bg-amber-100 disabled:opacity-60"
                  >
                    {loadingJobs ? "Checking listings…" : "Retry live listings"}
                  </button>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredJobs.slice(0, 6).map((job, index) => {
                  const jobId = getJobId(job);
                  const isDemo = String(jobId || "").startsWith("demo-");
                  const company = getCompanyName(job);

                  return (
                    <article
                      key={jobId || `${job.title}-${index}`}
                      className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-slate-900/5 sm:p-6"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xs font-black ${getLogoTone(index)}`}
                        >
                          {getInitials(company)}
                        </div>

                        {job?.verified === true && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
                            <CheckCircle2 size={12} />
                            Verified
                          </span>
                        )}

                        {isDemo && (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-800">
                            Sample preview
                          </span>
                        )}
                      </div>

                      <h3 className="mt-5 text-lg font-extrabold text-slate-950">
                        {job?.title || "Job opportunity"}
                      </h3>

                      <p className="mt-1 text-sm font-medium text-slate-600">
                        {company}
                      </p>

                      <div className="mt-5 space-y-3 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <MapPin size={15} className="text-slate-400" />
                          <span>{getLocation(job)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BriefcaseBusiness
                            size={15}
                            className="text-slate-400"
                          />
                          <span>{getJobType(job)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <WalletCards size={15} className="text-slate-400" />
                          <span>{getSalary(job)}</span>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-800">
                          {getCategory(job)}
                        </span>

                        {isDemo ? (
                          <button
                            type="button"
                            onClick={() => navigate("/jobs")}
                            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950"
                          >
                            Browse jobs
                            <ArrowRight size={14} />
                          </button>
                        ) : (
                          <Link
                            to={`/jobs${job?.title ? `?search=${encodeURIComponent(job.title)}` : ""}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950"
                          >
                            View opportunity
                            <ArrowRight size={14} />
                          </Link>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ABOUT SMARTHIRE */}
      <section id="about" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">
              About SmartHire
            </p>
            <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
              Helping people and opportunities find each other.
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-600 sm:text-base">
              SmartHire is an AI-powered job-matching platform designed with
              the Nigerian job market in mind. We help job seekers explore
              relevant roles and help employers discover candidates whose
              skills and experience align with their hiring needs.
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              Our goal is to make job discovery more relevant, hiring more
              informed, and career opportunities easier to navigate. SmartHire
              supports the connection between Nigerian talent and employers
              through a more thoughtful, skills-aware matching experience.
            </p>

            <button
              type="button"
              onClick={handleDashboard}
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
            >
              Get started with SmartHire
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                <Sparkles size={23} />
              </div>
              <h3 className="mt-5 text-base font-extrabold text-slate-950">
                Skills-aware matching
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Compare resume content with job requirements to surface
                relevant skills and areas for improvement.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-800">
                <ShieldCheck size={23} />
              </div>
              <h3 className="mt-5 text-base font-extrabold text-slate-950">
                Clearer insights
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Help job seekers understand relevant and missing skills
                instead of relying only on a job title.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-800">
                <Users size={23} />
              </div>
              <h3 className="mt-5 text-base font-extrabold text-slate-950">
                For both sides
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                A shared platform for job seekers pursuing opportunities and
                employers looking for talent.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
                <MapPin size={23} />
              </div>
              <h3 className="mt-5 text-base font-extrabold text-slate-950">
                Designed for Nigeria
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Focused on the needs of Nigerian job seekers, employers, and
                local employment opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* LOCATIONS */}
      <section className="border-y border-slate-100 bg-slate-50/70">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-18">
          <SectionHeading
            eyebrow="Opportunities across Nigeria"
            title="Where would you like to work?"
            description="Start exploring jobs in major employment hubs around the country."
          />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {locations.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => searchLocation(city)}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-300 hover:shadow-md"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                  <MapPin size={17} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-slate-800">
                    {city}
                  </span>
                  <span className="mt-1 block text-[10px] text-slate-500">
                    Explore jobs
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* EMPLOYER CTA */}
      <section className="px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[28px] bg-[#064e3b] px-6 py-10 text-white sm:px-10 sm:py-14 lg:px-14">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-[40px] border-white/5" />
          <div className="pointer-events-none absolute -bottom-32 right-1/4 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />

          <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div className="max-w-2xl">
              <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-200">
                For employers
              </p>
              <h2 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                Find talent that fits your needs.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-emerald-50/85 sm:text-base">
                Create a job listing and use SmartHire to compare candidate
                skills and experience with your role requirements.
              </p>
            </div>

            <button
              type="button"
              onClick={handlePostJob}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-extrabold text-emerald-900 transition hover:bg-emerald-50"
            >
              Post a job
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 md:grid-cols-2 md:items-center lg:px-10">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">
              Contact SmartHire
            </p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
              We'd love to hear from you.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-slate-600">
              Have a question, suggestion, or partnership enquiry? Reach out
              to us by email or connect with SmartHire on X.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
            <a
              href={`mailto:${EMAIL}?subject=${encodeURIComponent("SmartHire enquiry")}`}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              <Mail size={18} className="text-emerald-700" />
              Email SmartHire
              <ArrowUpRight size={15} />
            </a>

            <a
              href={X_PROFILE}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/70 text-[11px] font-black">
                X
              </span>
              Follow us on X
              <ArrowUpRight size={15} />
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#062f27] text-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.7fr_1fr]">
            <div>
              <Link to="/" className="inline-flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-white">
                  <Zap size={23} />
                </span>
                <span>
                  <span className="block text-xl font-black">
                    Smart<span className="text-emerald-300">Hire</span>
                  </span>
                  <span className="mt-0.5 block text-[10px] text-emerald-100/70">
                    Smarter Matching. Brighter Futures.
                  </span>
                </span>
              </Link>

              <p className="mt-5 max-w-sm text-sm leading-7 text-emerald-50/70">
                Connecting Nigerian talent with meaningful opportunities
                through skills-aware job matching.
              </p>

              <p className="mt-4 text-xs text-emerald-100/60">
                Built with the Nigerian job market in mind.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-white">
                Explore
              </h3>
              <div className="mt-4 flex flex-col items-start gap-3 text-sm text-emerald-50/70">
                <a href="#home" className="transition hover:text-white">
                  Home
                </a>
                <Link to="/jobs" className="transition hover:text-white">
                  Browse jobs
                </Link>
                <a href="#about" className="transition hover:text-white">
                  About SmartHire
                </a>
                <a href="#contact" className="transition hover:text-white">
                  Contact
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-white">
                Get in touch
              </h3>
              <p className="mt-4 text-sm leading-6 text-emerald-50/70">
                For questions, feedback, and enquiries, contact SmartHire
                through our official email or X profile.
              </p>

              <a
                href={`mailto:${EMAIL}`}
                className="mt-4 inline-flex max-w-full items-center gap-2 break-all text-sm font-semibold text-emerald-200 transition hover:text-white"
              >
                <Mail size={16} className="shrink-0" />
                {EMAIL}
              </a>

              <div className="mt-4 flex items-center gap-3">
                <a
                  href={`mailto:${EMAIL}`}
                  aria-label="Email SmartHire"
                  title="Email SmartHire"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 transition hover:border-emerald-300 hover:bg-white/10"
                >
                  <Mail size={17} />
                </a>

                <a
                  href={X_PROFILE}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="SmartHire on X, formerly Twitter"
                  title="SmartHire on X"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-sm font-black transition hover:border-emerald-300 hover:bg-white/10"
                >
                  X
                </a>
              </div>
            </div>
          </div>

          <div className="my-8 h-px bg-white/10" />

          <div className="flex flex-col gap-3 text-xs text-emerald-100/60 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} SmartHire. All rights reserved.
            </p>
            <p>Smarter Matching. Brighter Futures.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
