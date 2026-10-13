import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  HeartPulse,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
  X,
  Zap,
} from "lucide-react";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const categories = [
  {
    name: "Technology",
    jobs: "1,240+ jobs",
    icon: BriefcaseBusiness,
    tone: "green",
  },
  {
    name: "Finance",
    jobs: "680+ jobs",
    icon: WalletCards,
    tone: "green",
  },
  {
    name: "Marketing",
    jobs: "520+ jobs",
    icon: Sparkles,
    tone: "purple",
  },
  {
    name: "Healthcare",
    jobs: "410+ jobs",
    icon: HeartPulse,
    tone: "green",
  },
  {
    name: "Engineering",
    jobs: "390+ jobs",
    icon: Building2,
    tone: "orange",
  },
  {
    name: "Education",
    jobs: "350+ jobs",
    icon: GraduationCap,
    tone: "blue",
  },
];

const locations = [
  "Lagos",
  "Abuja",
  "Port Harcourt",
  "Ibadan",
  "Kano",
  "Enugu",
];

const fallbackJobs = [
  {
    _id: "demo-1",
    id: "demo-1",
    title: "Frontend Developer",
    company: "TechCore Nigeria",
    location: "Lagos, Nigeria",
    type: "Full-time",
    salary: "₦300,000 - ₦600,000/month",
    category: "Technology",
    verified: true,
  },
  {
    _id: "demo-2",
    id: "demo-2",
    title: "Financial Analyst",
    company: "Access Bank",
    location: "Abuja, Nigeria",
    type: "Full-time",
    salary: "₦250,000 - ₦450,000/month",
    category: "Finance",
    verified: true,
  },
  {
    _id: "demo-3",
    id: "demo-3",
    title: "Registered Nurse",
    company: "GreenHealth Hospital",
    location: "Port Harcourt, Nigeria",
    type: "Full-time",
    salary: "₦200,000 - ₦350,000/month",
    category: "Healthcare",
    verified: true,
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
  return job?.type || job?.employmentType || "Full-time";
}

function getSalary(job) {
  if (job?.salary) return job.salary;

  if (job?.salaryMin || job?.salaryMax) {
    const min = job.salaryMin
      ? `₦${Number(job.salaryMin).toLocaleString()}`
      : "";

    const max = job.salaryMax
      ? `₦${Number(job.salaryMax).toLocaleString()}`
      : "";

    if (min && max) return `${min} - ${max}/month`;
    return `${min || max}/month`;
  }

  return "Salary not specified";
}

function getCategory(job) {
  return (
    job?.category ||
    job?.industry ||
    job?.jobCategory ||
    "Technology"
  );
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function categoryColors(tone) {
  const colors = {
    green: {
      bg: "bg-emerald-50",
      icon: "bg-emerald-100 text-emerald-700",
    },
    purple: {
      bg: "bg-violet-50",
      icon: "bg-violet-100 text-violet-700",
    },
    orange: {
      bg: "bg-orange-50",
      icon: "bg-orange-100 text-orange-700",
    },
    blue: {
      bg: "bg-blue-50",
      icon: "bg-blue-100 text-blue-700",
    },
  };

  return colors[tone] || colors.green;
}

function getCompanyLogoClass(index) {
  const classes = [
    "bg-slate-900 text-white",
    "bg-orange-500 text-white",
    "bg-emerald-600 text-white",
    "bg-blue-600 text-white",
  ];

  return classes[index % classes.length];
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadJobs() {
      try {
        const { data } = await api.get("/jobs");

        if (!mounted) return;

        const receivedJobs = Array.isArray(data)
          ? data
          : Array.isArray(data?.jobs)
          ? data.jobs
          : [];

        setJobs(receivedJobs);
      } catch (error) {
        console.error("Failed to load jobs:", error);

        if (mounted) {
          setJobs([]);
        }
      } finally {
        if (mounted) {
          setLoadingJobs(false);
        }
      }
    }

    loadJobs();

    return () => {
      mounted = false;
    };
  }, []);

  const displayJobs = useMemo(() => {
    if (jobs.length > 0) return jobs;

    return fallbackJobs;
  }, [jobs]);

  const featuredJobs = displayJobs.slice(0, 3);

  function scrollToJobs() {
    document
      .getElementById("job-results")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleSearch(e) {
    e?.preventDefault();

    scrollToJobs();
  }

  function searchCategory(category) {
    setKeyword(category);
    setLocation("");
    setTimeout(scrollToJobs, 50);
  }

  function searchLocation(city) {
    setLocation(city);
    setKeyword("");
    setTimeout(scrollToJobs, 50);
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

  const filteredJobs = useMemo(() => {
    const searchKeyword = keyword.trim().toLowerCase();
    const searchLocation = location.trim().toLowerCase();

    return displayJobs.filter((job) => {
      const searchableText = [
        job?.title,
        getCompanyName(job),
        getCategory(job),
        job?.description,
        getLocation(job),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const jobLocation = getLocation(job).toLowerCase();

      const matchesKeyword =
        !searchKeyword || searchableText.includes(searchKeyword);

      const matchesLocation =
        !searchLocation || jobLocation.includes(searchLocation);

      return matchesKeyword && matchesLocation;
    });
  }, [displayJobs, keyword, location]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Mobile navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white lg:hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <Zap size={21} strokeWidth={2.5} />
              </div>

              <div>
                <div className="text-lg font-extrabold text-slate-900">
                  Smart<span className="text-emerald-600">Hire</span>
                </div>
                <div className="text-[9px] font-medium text-slate-400">
                  Smarter Matching. Brighter Futures.
                </div>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl p-2 text-slate-700 hover:bg-slate-100"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex flex-col gap-2 px-6 py-8">
            <a
              href="#home"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-4 py-3 font-semibold text-emerald-700 bg-emerald-50"
            >
              Home
            </a>

            <Link
              to="/jobs"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-4 py-3 font-medium text-slate-700 hover:bg-slate-50"
            >
              Jobs
            </Link>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                handlePostJob();
              }}
              className="rounded-xl px-4 py-3 text-left font-medium text-slate-700 hover:bg-slate-50"
            >
              For Employers
            </button>

            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-4 py-3 font-medium text-slate-700 hover:bg-slate-50"
            >
              About
            </a>

            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-4 py-3 font-medium text-slate-700 hover:bg-slate-50"
            >
              Resources
            </a>

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-6">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl border border-emerald-600 px-5 py-3 text-center font-semibold text-emerald-700"
              >
                Log in
              </Link>

              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl bg-emerald-600 px-5 py-3 text-center font-semibold text-white"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* HERO */}
      <section
        id="home"
        className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-slate-50"
      >
        {/* Decorative shapes */}
        <div className="pointer-events-none absolute -left-24 top-36 h-72 w-72 rounded-full bg-emerald-100/60 blur-2xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-emerald-100/40 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 pb-24 pt-10 sm:px-8 lg:px-10 lg:pb-28 lg:pt-16">
          <div className="grid items-center gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-8">
            {/* Left */}
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/80 px-4 py-2 text-xs font-bold text-emerald-700 shadow-sm backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Built for the Nigerian job market
              </div>

              <h1 className="text-5xl font-black leading-[0.98] tracking-[-0.045em] text-slate-900 sm:text-6xl lg:text-[68px]">
                Find work that fits
                <span className="block text-emerald-600">
                  your skills.
                </span>
              </h1>

              <p className="mt-7 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                SmartHire helps Nigerian job seekers discover relevant
                opportunities and helps employers find candidates based on
                what they can actually do.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={scrollToJobs}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700"
                >
                  Find a job
                  <ArrowRight
                    size={17}
                    className="transition group-hover:translate-x-1"
                  />
                </button>

                <button
                  type="button"
                  onClick={handlePostJob}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-6 py-3.5 text-sm font-bold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                  Post a job
                </button>
              </div>

              <div className="mt-8 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {["SA", "AO", "CN", "MK", "JO"].map((initials, index) => (
                    <div
                      key={initials}
                      className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-[10px] font-bold ${getCompanyLogoClass(
                        index
                      )}`}
                    >
                      {initials}
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Join 10,000+ Nigerians
                  </p>
                  <p className="text-xs text-slate-500">
                    building better futures
                  </p>
                </div>
              </div>
            </div>

            {/* Right hero visual */}
            <div className="relative min-h-[430px] lg:min-h-[530px]">
              <div className="absolute right-0 top-0 h-full w-full overflow-hidden rounded-[40px] bg-gradient-to-br from-emerald-100 to-slate-100 shadow-2xl shadow-emerald-900/10">
                <img
                  src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=1400&q=85"
                  alt="Professional Nigerian job seeker"
                  className="h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-emerald-950/5" />
              </div>

              {/* Better Matches card */}
              <div className="absolute left-0 top-12 z-10 hidden w-44 rounded-2xl border border-white/80 bg-white/95 p-4 shadow-xl backdrop-blur sm:block">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <BriefcaseBusiness size={20} />
                  </div>

                  <div>
                    <p className="text-xs font-extrabold text-slate-900">
                      Better Matches
                    </p>
                    <p className="mt-1 text-[10px] leading-4 text-slate-500">
                      AI-powered job matching
                    </p>
                  </div>
                </div>
              </div>

              {/* More opportunities */}
              <div className="absolute right-0 top-24 z-10 hidden w-48 rounded-2xl border border-white/80 bg-white/95 p-4 shadow-xl backdrop-blur md:block">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Sparkles size={19} />
                  </div>

                  <div>
                    <p className="text-xs font-extrabold text-slate-900">
                      More Opportunities
                    </p>
                    <p className="mt-1 text-[10px] leading-4 text-slate-500">
                      For job seekers and employers
                    </p>
                  </div>
                </div>
              </div>

              {/* Nigeria first */}
              <div className="absolute bottom-12 right-0 z-10 hidden w-40 rounded-2xl border border-white/80 bg-white/95 p-4 shadow-xl backdrop-blur sm:block">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <span className="text-lg">🇳🇬</span>
                  </div>

                  <div>
                    <p className="text-xs font-extrabold text-slate-900">
                      Nigeria First
                    </p>
                    <p className="mt-1 text-[10px] leading-4 text-slate-500">
                      Local jobs. Local talent.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative z-20 mx-auto -mb-10 max-w-5xl px-5 sm:px-8">
          <form
            onSubmit={handleSearch}
            className="rounded-2xl border border-slate-100 bg-white p-3 shadow-2xl shadow-slate-900/10"
          >
            <div className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1.25fr)_minmax(0,0.9fr)_auto]">
              <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10">
                <Search size={19} className="shrink-0 text-slate-400" />

                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Job title, skill or company"
                  aria-label="Search by job title, skill or company"
                  autoComplete="off"
                  className="h-12 min-w-0 flex-1 bg-white text-base text-slate-900 caret-emerald-700 outline-none placeholder:text-slate-500 md:text-sm"
                />
              </div>

              <div className="relative flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10">
                <MapPin size={19} className="shrink-0 text-slate-400" />

                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  aria-label="Filter jobs by location"
                  className="h-12 min-w-0 w-full flex-1 appearance-none bg-white text-base text-slate-900 outline-none md:text-sm"
                >
                  <option value="">Location</option>
                  {locations.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={17}
                  className="pointer-events-none absolute right-4 text-slate-400"
                />
              </div>

              <button
                type="submit"
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-7 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                Search jobs
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* POPULAR CATEGORIES */}
      <section className="mx-auto max-w-7xl px-5 pb-8 pt-24 sm:px-8 lg:px-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              Popular Categories
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Explore jobs in top industries
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/jobs")}
            className="hidden items-center gap-1 text-xs font-bold text-emerald-700 sm:flex"
          >
            View all categories
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => {
            const Icon = category.icon;
            const colors = categoryColors(category.tone);

            return (
              <button
                key={category.name}
                type="button"
                onClick={() => searchCategory(category.name)}
                className={`group rounded-2xl border border-slate-100 ${colors.bg} p-5 text-left transition hover:-translate-y-1 hover:shadow-lg`}
              >
                <div
                  className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${colors.icon}`}
                >
                  <Icon size={21} />
                </div>

                <h3 className="text-sm font-extrabold text-slate-800">
                  {category.name}
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  {category.jobs}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* FEATURED JOBS */}
      <section
        id="job-results"
        className="mx-auto max-w-7xl scroll-mt-20 px-5 py-12 sm:px-8 lg:px-10"
      >
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              Featured Jobs
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {keyword || location
                ? `Showing results for ${
                    keyword ? `"${keyword}"` : ""
                  }${keyword && location ? " in " : ""}${
                    location ? location : ""
                  }`
                : "Handpicked opportunities for you"}
            </p>
          </div>

          <Link
            to="/jobs"
            className="hidden items-center gap-1 text-xs font-bold text-emerald-700 sm:flex"
          >
            View all jobs
            <ArrowRight size={14} />
          </Link>
        </div>

        {loadingJobs ? (
          <div className="grid gap-5 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-52 animate-pulse rounded-2xl border border-slate-100 bg-slate-50"
              />
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
              <Search size={22} />
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-800">
              No jobs found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Try another keyword or location.
            </p>

            <button
              type="button"
              onClick={() => {
                setKeyword("");
                setLocation("");
              }}
              className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-3">
            {filteredJobs.slice(0, 3).map((job, index) => {
              const jobId = getJobId(job);
              const company = getCompanyName(job);

              return (
                <Link
                  key={jobId || index}
                  to={jobId ? `/jobs/${jobId}` : "/jobs"}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-slate-900/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl text-xs font-black ${getCompanyLogoClass(
                          index
                        )}`}
                      >
                        {getInitials(company) || "SH"}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-700">
                            {company}
                          </p>

                          {(job?.verified ?? true) && (
                            <CheckCircle2
                              size={13}
                              className="fill-emerald-100 text-emerald-600"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
                      <ArrowRight size={16} />
                    </div>
                  </div>

                  <h3 className="mt-5 text-base font-extrabold text-slate-900">
                    {job?.title || "Job opportunity"}
                  </h3>

                  <div className="mt-3 space-y-2 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} />
                      {getLocation(job)}
                    </div>

                    <div className="flex items-center gap-2">
                      <BriefcaseBusiness size={14} />
                      {getJobType(job)}
                    </div>

                    <div className="flex items-center gap-2">
                      <WalletCards size={14} />
                      {getSalary(job)}
                    </div>
                  </div>

                  <div className="mt-4">
                    <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700">
                      {getCategory(job)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* WHY SMARTHIRE */}
      <section
        id="how-it-works"
        className="border-y border-emerald-50 bg-emerald-50/70"
      >
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.1fr_2fr] lg:px-10 lg:py-16">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-white px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 shadow-sm">
              Why SmartHire
            </div>

            <h2 className="max-w-md text-3xl font-black tracking-tight text-slate-900">
              More than just a job board
            </h2>

            <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
              We use AI to understand your skills, experience and goals — not
              just keywords. Get better matches, fairer opportunities and a
              smoother hiring process.
            </p>

            <button
              type="button"
              onClick={() => navigate("/jobs")}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white transition hover:bg-emerald-700"
            >
              Learn more
              <ArrowRight size={15} />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Sparkles size={21} />
              </div>

              <h3 className="mt-5 text-sm font-extrabold text-slate-900">
                AI-Powered Matching
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Find jobs and candidates that truly fit.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <ShieldCheck size={21} />
              </div>

              <h3 className="mt-5 text-sm font-extrabold text-slate-900">
                Fair & Transparent
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Reduce bias and increase opportunities.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <BriefcaseBusiness size={21} />
              </div>

              <h3 className="mt-5 text-sm font-extrabold text-slate-900">
                Mobile Friendly
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Access jobs anytime, anywhere.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Users size={21} />
              </div>

              <h3 className="mt-5 text-sm font-extrabold text-slate-900">
                Built for Nigeria
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Supporting local talent and businesses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* LOCATIONS */}
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
        <div className="mb-7">
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            Find opportunities across Nigeria
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Explore jobs in some of Nigeria's biggest employment hubs.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {locations.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => searchLocation(city)}
              className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <MapPin size={17} />
              </div>

              <div>
                <p className="text-sm font-bold text-slate-800">{city}</p>
                <p className="text-[10px] text-slate-400">View jobs</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* EMPLOYER CTA */}
      <section className="px-5 pb-14 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[30px] bg-emerald-700 px-6 py-12 text-white shadow-2xl shadow-emerald-900/15 sm:px-10 lg:px-14">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="mb-3 inline-flex rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-100">
                For employers
              </div>

              <h2 className="max-w-2xl text-3xl font-black tracking-tight sm:text-4xl">
                Find the people who can actually do the job.
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-emerald-50/80">
                Post your opportunity and let SmartHire help you discover
                candidates based on their skills and experience.
              </p>
            </div>

            <button
              type="button"
              onClick={handlePostJob}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
            >
              Post a job
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative overflow-hidden bg-[#003d32] text-white">
        <div className="absolute inset-x-0 bottom-0 h-28 opacity-10">
          <div className="absolute bottom-0 left-[5%] h-20 w-12 bg-white" />
          <div className="absolute bottom-0 left-[9%] h-28 w-16 bg-white" />
          <div className="absolute bottom-0 left-[15%] h-16 w-10 bg-white" />
          <div className="absolute bottom-0 left-[21%] h-24 w-14 bg-white" />
          <div className="absolute bottom-0 left-[27%] h-12 w-20 bg-white" />
          <div className="absolute bottom-0 left-[34%] h-28 w-12 bg-white" />
          <div className="absolute bottom-0 left-[40%] h-20 w-20 bg-white" />
          <div className="absolute bottom-0 left-[48%] h-28 w-14 bg-white" />
          <div className="absolute bottom-0 left-[55%] h-16 w-12 bg-white" />
          <div className="absolute bottom-0 left-[61%] h-24 w-20 bg-white" />
          <div className="absolute bottom-0 left-[69%] h-14 w-12 bg-white" />
          <div className="absolute bottom-0 left-[75%] h-28 w-16 bg-white" />
          <div className="absolute bottom-0 left-[83%] h-20 w-14 bg-white" />
          <div className="absolute bottom-0 left-[91%] h-24 w-16 bg-white" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white">
                  <Zap size={23} />
                </div>

                <div>
                  <div className="text-xl font-extrabold">
                    Smart<span className="text-emerald-300">Hire</span>
                  </div>

                  <p className="text-[9px] font-medium text-emerald-100/60">
                    Smarter Matching. Brighter Futures.
                  </p>
                </div>
              </div>

              <p className="mt-5 max-w-md text-sm leading-6 text-emerald-100/70">
                Connecting Nigerian talent with meaningful opportunities
                through smarter job matching.
              </p>
            </div>

            <div className="text-left lg:text-right">
              <p className="text-lg font-extrabold">
                Ready to take the next step?
              </p>

              <p className="mt-2 max-w-md text-xs leading-5 text-emerald-100/70 lg:ml-auto">
                Join Nigerians who are already building their future with
                SmartHire.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row lg:justify-end">
                <button
                  type="button"
                  onClick={scrollToJobs}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-xs font-bold text-white transition hover:bg-emerald-400"
                >
                  Find a job
                  <ArrowRight size={15} />
                </button>

                <button
                  type="button"
                  onClick={handlePostJob}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-5 py-3 text-xs font-bold text-white transition hover:bg-white/10"
                >
                  Post a job
                </button>
              </div>
            </div>
          </div>

          <div className="my-8 h-px bg-white/10" />

          <div className="flex flex-col gap-5 text-xs text-emerald-100/60 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              <Link to="/" className="transition hover:text-white">
                Home
              </Link>

              <Link to="/jobs" className="transition hover:text-white">
                Jobs
              </Link>

              <button
                type="button"
                onClick={handlePostJob}
                className="transition hover:text-white"
              >
                For Employers
              </button>

              <a
                href="#how-it-works"
                className="transition hover:text-white"
              >
                About
              </a>

              <a
                href="#how-it-works"
                className="transition hover:text-white"
              >
                Resources
              </a>
            </div>

            <div className="flex items-center gap-4">
              <span>© 2026 SmartHire. All rights reserved.</span>

              <div className="hidden items-center gap-2 sm:flex">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15">
                  f
                </span>

                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15">
                  X
                </span>

                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15">
                  ◎
                </span>

                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15">
                  in
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}