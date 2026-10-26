import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Sparkles,
  Target,
} from "lucide-react";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API_ORIGIN = new URL(API_BASE_URL, window.location.origin).origin;

function getImageUrl(url) {
  if (!url) return "";

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${API_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
}

const today = new Date().toLocaleDateString("en-NG", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default function JobSeekerDashboard() {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [matches, setMatches] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [photoFailed, setPhotoFailed] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  const loadData = useCallback(async () => {
    setDashboardLoading(true);
    setDashboardError("");
    try {
      const [profileRes, resumeRes, matchRes] = await Promise.allSettled([
        api.get("/profile/jobseeker"),
        api.get("/resumes/mine"),
        api.get("/matches/mine"),
      ]);

      const failedRequests = [];

      if (profileRes.status === "fulfilled") {
        setProfile(profileRes.value.data);
        setPhotoFailed(false);
      } else {
        failedRequests.push("profile");
        console.error("Unable to load job seeker profile:", profileRes.reason);
      }

      if (resumeRes.status === "fulfilled") {
        setResumes(Array.isArray(resumeRes.value.data) ? resumeRes.value.data : []);
      } else {
        failedRequests.push("resumes");
        console.error("Unable to load resumes:", resumeRes.reason);
      }

      if (matchRes.status === "fulfilled") {
        setMatches(Array.isArray(matchRes.value.data) ? matchRes.value.data : []);
      } else {
        failedRequests.push("matches");
        console.error("Unable to load job matches:", matchRes.reason);
      }

      if (failedRequests.length) {
        setDashboardError(
          `Some dashboard information could not be loaded (${failedRequests.join(", ")}). You can retry without losing the sections that loaded successfully.`
        );
      }
    } catch (err) {
      console.error("Dashboard loading error:", err);
      setDashboardError(
        err.response?.data?.error ||
          "Some dashboard information could not be loaded. Check your connection and try again."
      );
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleUpload(e) {
    e.preventDefault();

    if (!file) {
      setMessage("Choose a PDF or DOCX CV before uploading.");
      return;
    }

    const fileName = String(file.name || "").toLowerCase();
    const allowedExtension = fileName.endsWith(".pdf") || fileName.endsWith(".docx");
    if (!allowedExtension) {
      setMessage("Please choose a PDF or DOCX file.");
      setFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Your CV must be 5 MB or smaller.");
      setFile(null);
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("resume", file);

      await api.post("/resumes/upload", formData);

      setMessage("Resume uploaded successfully.");
      setFile(null);
      e.target.reset();

      await loadData();
    } catch (err) {
      setMessage(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  const firstName =
    profile?.fullName?.split(" ")[0] ||
    profile?.firstName ||
    user?.firstName ||
    user?.name?.split(" ")[0] ||
    "there";

  const photoUrl = getImageUrl(profile?.photoUrl);

  return (
    <main className="min-h-screen bg-[#F7F5EE] px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-5xl">
        {/* HEADER */}
        <header className="mb-8">
          <p className="mb-1 text-xs text-[#737B76]">{today}</p>

          <h1 className="font-serif text-3xl text-[#16241E] sm:text-4xl">
            Welcome, {firstName}
          </h1>

          <p className="mt-2 text-sm text-[#737B76]">
            Manage your professional profile, resume, career guidance and job matches.
          </p>
        </header>

        {dashboardError && (
          <div role="alert" className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
            <p>{dashboardError}</p>
            <button
              type="button"
              onClick={loadData}
              disabled={dashboardLoading}
              className="self-start rounded-lg border border-amber-300 bg-white px-3 py-2 font-semibold transition hover:bg-amber-100 disabled:opacity-60 sm:self-auto"
            >
              {dashboardLoading ? "Refreshing…" : "Try again"}
            </button>
          </div>
        )}

        {dashboardLoading && !profile ? (
          <div className="mb-8 rounded-2xl border border-[#DCD8CC] bg-white p-5" role="status" aria-live="polite">
            <div className="h-4 w-40 animate-pulse rounded bg-[#E7E5DD]" />
            <div className="mt-3 h-3 w-64 max-w-full animate-pulse rounded bg-[#E7E5DD]" />
            <span className="sr-only">Loading your dashboard…</span>
          </div>
        ) : null}

        {/* AI CAREER AGENT */}
        <section className="relative mb-8 overflow-hidden rounded-3xl bg-[#16241E] p-6 text-white shadow-lg sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                <Sparkles size={14} />
                YOUR PERSONAL CAREER ASSISTANT
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl">
                Meet your AI Career Agent.
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                Explore relevant job opportunities, understand your CV match
                results, discover skills to develop and get practical career
                recommendations.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-xs text-slate-200">
                  <BriefcaseBusiness size={14} />
                  Job discovery
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-xs text-slate-200">
                  <Target size={14} />
                  Match analysis
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-xs text-slate-200">
                  <Sparkles size={14} />
                  Career guidance
                </span>
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-start gap-4 sm:items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                <Bot size={36} />
              </div>

              <Link
                to="/dashboard/jobseeker/agent"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#58A779] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#438C61] sm:w-auto"
              >
                Open Career Agent
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </section>

        {/* QUICK ACTIONS */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2">
          <Link
            to="/jobs"
            className="group flex items-center gap-4 rounded-2xl border border-[#DCD8CC] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#2F6F4E] hover:shadow-sm"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E7F0EA] text-[#2F6F4E]">
              <BriefcaseBusiness size={23} />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-[#16241E]">
                Browse Jobs
              </h3>
              <p className="mt-1 text-sm text-[#737B76]">
                Explore available opportunities.
              </p>
            </div>

            <ArrowRight
              size={18}
              className="text-[#737B76] transition group-hover:translate-x-1 group-hover:text-[#2F6F4E]"
            />
          </Link>

          <a
            href="#match-scores"
            className="group flex items-center gap-4 rounded-2xl border border-[#DCD8CC] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#2F6F4E] hover:shadow-sm"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#E7F0EA] text-[#2F6F4E]">
              <Target size={23} />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-[#16241E]">
                Your Match Scores
              </h3>
              <p className="mt-1 text-sm text-[#737B76]">
                Review your saved job matches.
              </p>
            </div>

            <ArrowRight
              size={18}
              className="text-[#737B76] transition group-hover:translate-x-1 group-hover:text-[#2F6F4E]"
            />
          </a>
        </section>

        {/* PROFILE CARD */}
        <section className="mb-8 rounded-2xl border border-[#DCD8CC] bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#DCD8CC] bg-[#E7F0EA] sm:h-24 sm:w-24">
                {photoUrl && !photoFailed ? (
                  <img
                    src={photoUrl}
                    alt={profile?.fullName || "Profile photo"}
                    className="h-full w-full object-cover"
                    onError={() => setPhotoFailed(true)}
                  />
                ) : (
                  <span className="text-3xl">
                    {(
                      profile?.firstName?.[0] ||
                      profile?.fullName?.[0] ||
                      user?.name?.[0] ||
                      "👤"
                    ).toUpperCase()}
                  </span>
                )}
              </div>

              <div>
                <p className="mb-1 text-xs uppercase tracking-[0.16em] text-[#2F6F4E]">
                  Professional Profile
                </p>

                <h2 className="font-serif text-2xl text-[#16241E]">
                  {profile?.fullName || user?.name || "Your Profile"}
                </h2>

                <p className="mt-1 text-sm text-[#737B76]">
                  {profile?.professionalTitle || "Add your professional title"}
                </p>

                {profile?.location && (
                  <p className="mt-2 text-xs text-[#737B76]">
                    📍 {profile.location}
                  </p>
                )}
              </div>
            </div>

            <Link
              to="/dashboard/jobseeker/profile"
              className="whitespace-nowrap rounded-lg bg-[#2F6F4E] px-5 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-[#234F38]"
            >
              Edit Profile
            </Link>
          </div>

          {profile && (
            <div className="mt-6 grid grid-cols-1 gap-4 border-t border-[#DCD8CC] pt-5 sm:grid-cols-2">
              {profile.phone && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#737B76]">
                    Phone
                  </p>
                  <p className="mt-1 text-sm text-[#16241E]">
                    {profile.phone}
                  </p>
                </div>
              )}

              {profile.portfolio && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#737B76]">
                    Portfolio
                  </p>
                  <p className="mt-1 break-all text-sm text-[#16241E]">
                    {profile.portfolio}
                  </p>
                </div>
              )}

              {profile.skills && (
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-[#737B76]">
                    Skills
                  </p>
                  <p className="mt-1 text-sm text-[#16241E]">
                    {Array.isArray(profile.skills)
                      ? profile.skills.join(", ")
                      : profile.skills}
                  </p>
                </div>
              )}

              {profile.about && (
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-[#737B76]">
                    About
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#16241E]">
                    {profile.about}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* RESUME */}
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E7F0EA] text-[#2F6F4E]">
              <FileText size={21} />
            </div>

            <div>
              <h2 className="font-serif text-xl text-[#16241E]">
                Your resume
              </h2>
              <p className="mt-1 text-sm text-[#737B76]">
                Upload your CV to check your suitability for jobs.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleUpload}
            className="rounded-2xl border border-[#DCD8CC] bg-white p-5 sm:p-6"
          >
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <input
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  const selected = e.target.files?.[0] || null;
                  setMessage("");
                  if (!selected) {
                    setFile(null);
                    return;
                  }
                  const name = String(selected.name || "").toLowerCase();
                  if (!name.endsWith(".pdf") && !name.endsWith(".docx")) {
                    setFile(null);
                    setMessage("Please choose a PDF or DOCX file.");
                    e.target.value = "";
                    return;
                  }
                  if (selected.size > 5 * 1024 * 1024) {
                    setFile(null);
                    setMessage("Your CV must be 5 MB or smaller.");
                    e.target.value = "";
                    return;
                  }
                  setFile(selected);
                }}
                className="w-full text-sm text-[#737B76]"
              />

              <button
                type="submit"
                disabled={uploading || !file}
                className="whitespace-nowrap rounded-lg bg-[#2F6F4E] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#234F38] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? "Uploading..." : "Upload Resume"}
              </button>
            </div>

            {message && (
              <p className="mt-4 text-sm text-[#47725A]" role="status">
                {message}
              </p>
            )}
            <p className="mt-3 text-xs leading-5 text-[#737B76]">Accepted formats: PDF or DOCX · Maximum file size: 5 MB.</p>
          </form>

          <div className="mt-4 divide-y divide-[#DCD8CC] rounded-2xl border border-[#DCD8CC] bg-white">
            {resumes.map((resume) => (
              <div
                key={resume._id}
                className="flex items-center gap-3 p-4 text-sm text-[#16241E]"
              >
                <FileText size={18} className="shrink-0 text-[#2F6F4E]" />
                <span className="break-all">{resume.fileName}</span>
                <CheckCircle2
                  size={17}
                  className="ml-auto shrink-0 text-[#2F6F4E]"
                />
              </div>
            ))}

            {resumes.length === 0 && (
              <div className="p-5 text-sm text-[#737B76]">
                No resume uploaded yet.
              </div>
            )}
          </div>
        </section>

        {/* MATCH SCORES */}
        <section id="match-scores" className="scroll-mt-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-xl text-[#16241E]">
                Your match scores
              </h2>
              <p className="mt-1 text-sm text-[#737B76]">
                Review your CV compatibility with saved job matches.
              </p>
            </div>

            <span className="rounded-full bg-[#E7F0EA] px-3 py-1 text-xs font-semibold text-[#2F6F4E]">
              {matches.length} {matches.length === 1 ? "match" : "matches"}
            </span>
          </div>

          <div className="divide-y divide-[#DCD8CC] rounded-2xl border border-[#DCD8CC] bg-white">
            {matches.map((match) => {
              const score = Math.round(Number(match.finalScore || 0) * 100);

              return (
                <div
                  key={match._id}
                  className="flex items-center justify-between gap-4 p-4 sm:p-5"
                >
                  <div className="min-w-0">
                    <p className="break-words font-medium text-[#16241E]">
                      {match.job?.title || "Job listing"}
                    </p>

                    <p className="mt-1 text-sm text-[#737B76]">
                      {match.job?.location || "Location not specified"}
                    </p>

                    <div className="mt-3 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-[#E7E5DD]">
                      <div
                        className="h-full rounded-full bg-[#2F6F4E]"
                        style={{
                          width: `${Math.min(100, Math.max(0, score))}%`,
                        }}
                      />
                    </div>
                  </div>

                  <span className="shrink-0 font-serif text-2xl text-[#2F6F4E]">
                    {score}%
                  </span>
                </div>
              );
            })}

            {matches.length === 0 && (
              <div className="p-5 text-sm leading-6 text-[#737B76]">
                No matches yet. Browse jobs, upload your CV and check your
                compatibility with a job.
              </div>
            )}
          </div>
        </section>

        {/* CAREER AGENT REMINDER */}
        <section className="mt-8 flex flex-col gap-4 rounded-2xl border border-[#DCD8CC] bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="font-serif text-lg text-[#16241E]">
              Ready for your next career move?
            </h2>
            <p className="mt-1 text-sm leading-6 text-[#737B76]">
              Visit your Career Agent for job discovery, match explanations
              and skill-development recommendations.
            </p>
          </div>

          <Link
            to="/dashboard/jobseeker/agent"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#2F6F4E] px-4 py-3 text-sm font-semibold text-[#2F6F4E] transition hover:bg-[#E7F0EA]"
          >
            <Bot size={18} />
            Open Career Agent
            <ArrowRight size={16} />
          </Link>
        </section>
      </div>
    </main>
  );
}