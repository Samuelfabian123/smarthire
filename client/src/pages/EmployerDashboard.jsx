import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API_ORIGIN = new URL(API_BASE_URL, window.location.origin).origin;

function getImageUrl(url) {
  if (!url) return "";
  if (/^(https?:\/\/|data:image\/)/i.test(url)) return url;

  return `${API_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
}

const today = new Date().toLocaleDateString("en-NG", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default function EmployerDashboard() {
  const { user } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [savingJob, setSavingJob] = useState(false);
  const [jobError, setJobError] = useState("");
  const [profileError, setProfileError] = useState("");
  const [loadingJobs, setLoadingJobs] = useState(true);

  const loadData = useCallback(async () => {
    setLoadingJobs(true);
    setJobError("");
    setProfileError("");

    try {
      const [jobsResult, profileResult] = await Promise.allSettled([
        api.get("/jobs/mine"),
        api.get("/profile/employer"),
      ]);

      if (jobsResult.status === "fulfilled") {
        const result = jobsResult.value.data;
        setJobs(Array.isArray(result) ? result : []);
      } else {
        console.error(
          "Unable to load employer jobs:",
          jobsResult.reason
        );

        setJobError(
          jobsResult.reason?.response?.data?.error ||
            "Unable to load your jobs. Please try again."
        );
      }

      if (profileResult.status === "fulfilled") {
        setCompanyProfile(profileResult.value.data);
      } else {
        console.error(
          "Unable to load company profile:",
          profileResult.reason
        );

        setProfileError(
          profileResult.reason?.response?.data?.error ||
            "Company information could not be loaded."
        );
      }
    } catch (error) {
      console.error("Unable to load employer dashboard:", error);
      setJobError("Unable to load your dashboard. Please try again.");
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const companyName =
    companyProfile?.companyName || user?.name || "Your Company";

  function openEditJob(job) {
    setJobError("");

    setEditingJob({
      _id: job._id,
      title: job.title || "",
      location: job.location || "",
      description: job.description || "",
      skillsRequired: Array.isArray(job.skillsRequired)
        ? job.skillsRequired.join(", ")
        : "",
    });
  }

  function closeEditJob() {
    if (savingJob) return;

    setEditingJob(null);
    setJobError("");
  }

  async function handleUpdateJob(event) {
    event.preventDefault();

    if (!editingJob.title.trim() || !editingJob.description.trim()) {
      setJobError("Job title and description are required.");
      return;
    }

    try {
      setSavingJob(true);
      setJobError("");

      const skillsRequired = editingJob.skillsRequired
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);

      const response = await api.put(`/jobs/${editingJob._id}`, {
        title: editingJob.title.trim(),
        location: editingJob.location.trim(),
        description: editingJob.description.trim(),
        skillsRequired,
      });

      const updatedJob = response.data?.job || response.data;

      setJobs((currentJobs) =>
        currentJobs.map((job) =>
          job._id === editingJob._id
            ? { ...job, ...updatedJob }
            : job
        )
      );

      setEditingJob(null);
    } catch (error) {
      console.error("Failed to update job:", error);

      setJobError(
        error?.response?.data?.error ||
          "Failed to update job. Please try again."
      );
    } finally {
      setSavingJob(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5EE]">
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        {/* AI HERO */}
        <section className="relative mb-8 overflow-hidden rounded-3xl bg-[#14231C] text-white">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-[#5E9875]/30" />
          <div className="absolute right-8 top-8 h-40 w-40 rounded-full border border-[#5E9875]/20" />
          <div className="absolute -right-12 bottom-[-80px] h-56 w-56 rounded-full bg-[#2F6F4E]/20" />

          <div className="relative z-10 grid grid-cols-1 items-center gap-8 p-6 sm:p-8 lg:grid-cols-2 lg:p-12">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#294535] px-3 py-1.5 text-xs font-medium text-[#A9D0B7]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7FC497]" />
                SmartHire AI
              </div>

              <h1 className="font-serif text-3xl leading-tight sm:text-4xl lg:text-5xl">
                Find people who{" "}
                <span className="text-[#9FD0AF]">fit the role.</span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#D4DFD9] sm:text-base">
                SmartHire analyses job requirements and candidate skills to
                help you discover relevant talent faster.
              </p>

              <p className="mt-5 text-xs text-[#AFC2B7]">{today}</p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/jobs/new"
                  className="inline-flex items-center justify-center rounded-lg bg-[#F7F5EE] px-5 py-3 text-sm font-medium text-[#16241E] transition-colors hover:bg-white"
                >
                  + Post a job
                </Link>

                {jobs.length > 0 && (
                  <a
                    href="#job-postings"
                    className="inline-flex items-center justify-center rounded-lg border border-[#668A75] px-5 py-3 text-sm font-medium text-[#E2EBE6] transition-colors hover:bg-[#294535]"
                  >
                    View your jobs
                  </a>
                )}
              </div>
            </div>

            <div className="hidden justify-center lg:flex">
              <div className="relative h-64 w-72">
                <div className="absolute left-8 top-20 w-24 border-t border-[#557C65]" />
                <div className="absolute right-8 top-20 w-24 border-t border-[#557C65]" />
                <div className="absolute left-1/2 top-8 h-12 border-l border-[#557C65]" />
                <div className="absolute bottom-8 left-1/2 h-12 border-l border-[#557C65]" />

                <div className="absolute left-0 top-12 flex h-20 w-20 flex-col items-center justify-center rounded-2xl border border-[#52745F] bg-[#22382C]">
                  <span className="text-xl">👤</span>
                  <span className="mt-1 text-[10px] text-[#BFD1C7]">
                    Candidate
                  </span>
                </div>

                <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-4 border-[#406B53] bg-[#2F6F4E] shadow-lg">
                  <span className="text-2xl">✦</span>
                  <span className="mt-1 text-[10px] text-white">
                    AI Match
                  </span>
                </div>

                <div className="absolute right-0 top-12 flex h-20 w-20 flex-col items-center justify-center rounded-2xl border border-[#52745F] bg-[#22382C]">
                  <span className="text-xl">💼</span>
                  <span className="mt-1 text-[10px] text-[#BFD1C7]">
                    Job
                  </span>
                </div>

                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full bg-[#E7F0EA] px-4 py-2 text-xs font-semibold text-[#2F6F4E]">
                  Compatibility
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COMPANY PROFILE */}
        <section className="mb-8 rounded-2xl border border-[#DCD8CC] bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#DCD8CC] bg-[#E7F0EA] text-3xl sm:h-24 sm:w-24">
                {(companyProfile?.logoDataUrl || companyProfile?.logoUrl) ? (
                  <img
                    src={getImageUrl(companyProfile.logoDataUrl || companyProfile.logoUrl)}
                    alt="Company Logo"
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <span>🏢</span>
                )}
              </div>

              <div className="min-w-0">
                <p className="mb-1 text-xs uppercase tracking-[0.16em] text-[#2F6F4E]">
                  Your company
                </p>

                <h2 className="break-words font-serif text-2xl text-[#16241E] sm:text-3xl">
                  {companyName}
                </h2>

                <p className="mt-1 text-sm text-[#737B76]">
                  {companyProfile
                    ? `${companyProfile.industry || "Company profile"}${
                        companyProfile.location
                          ? ` • ${companyProfile.location}`
                          : ""
                      }`
                    : "Create your company profile to help candidates learn more about your organisation."}
                </p>
              </div>
            </div>

            <Link
              to="/dashboard/employer/profile"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-[#2F6F4E] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#234F38]"
            >
              {companyProfile
                ? "Edit Company Profile"
                : "Create Company Profile"}
            </Link>
          </div>

          {profileError && (
            <p role="alert" className="mt-4 text-sm text-amber-700">
              {profileError} You can still open the company profile to review it.
            </p>
          )}

          {companyProfile && (
            <div className="mt-6 border-t border-[#DCD8CC] pt-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {[
                  ["Contact Person", companyProfile.contactName],
                  ["Email", companyProfile.email],
                  ["Phone", companyProfile.phone],
                  ["Location", companyProfile.location],
                  ["Industry", companyProfile.industry],
                ]
                  .filter(([, value]) => value)
                  .map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs uppercase tracking-wide text-[#737B76]">
                        {label}
                      </p>
                      <p className="mt-1 break-words text-sm text-[#16241E]">
                        {value}
                      </p>
                    </div>
                  ))}

                {companyProfile.website && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#737B76]">
                      Website
                    </p>
                    <a
                      href={
                        /^https?:\/\//i.test(companyProfile.website)
                          ? companyProfile.website
                          : `https://${companyProfile.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block break-all text-sm text-[#2F6F4E] hover:underline"
                    >
                      {companyProfile.website}
                    </a>
                  </div>
                )}
              </div>

              {companyProfile.description && (
                <div className="mt-5 border-t border-[#ECE9E1] pt-5">
                  <p className="text-xs uppercase tracking-wide text-[#737B76]">
                    About the Company
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#16241E]">
                    {companyProfile.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* STATS */}
        <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#DCD8CC] bg-white p-5 sm:p-6">
            <p className="text-xs uppercase tracking-wider text-[#7A827D]">
              Active jobs
            </p>
            <div className="mt-2 flex items-end justify-between">
              <p className="font-serif text-4xl text-[#16241E]">
                {loadingJobs ? "—" : jobs.length}
              </p>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E7F0EA] text-[#2F6F4E]">
                💼
              </div>
            </div>
            <p className="mt-1 text-xs text-[#8A918D]">
              Current job postings
            </p>
          </div>

          <div className="rounded-2xl border border-[#C9DACF] bg-[#E7F0EA] p-5 sm:p-6">
            <p className="text-xs uppercase tracking-wider text-[#47725A]">
              Matching engine
            </p>
            <div className="mt-2 flex items-end justify-between">
              <p className="font-serif text-2xl text-[#16241E]">
                AI-powered
              </p>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#2F6F4E]">
                ✦
              </div>
            </div>
            <p className="mt-2 text-xs text-[#66806F]">
              Skills and job compatibility
            </p>
          </div>

          <div className="rounded-2xl border border-[#DCD8CC] bg-white p-5 sm:p-6">
            <p className="text-xs uppercase tracking-wider text-[#7A827D]">
              Hiring workflow
            </p>
            <div className="mt-2 flex items-end justify-between">
              <p className="font-serif text-2xl text-[#16241E]">Simple</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F0F3EF] text-[#2F6F4E]">
                ✓
              </div>
            </div>
            <p className="mt-2 text-xs text-[#8A918D]">
              Post → Match → Review
            </p>
          </div>
        </section>

        {/* JOB POSTINGS */}
        <section id="job-postings">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-1 text-xs uppercase tracking-[0.16em] text-[#2F6F4E]">
                AI-assisted hiring
              </p>
              <h2 className="font-serif text-2xl text-[#16241E] sm:text-3xl">
                Your job postings
              </h2>
            </div>

            {jobs.length > 0 && (
              <p className="text-xs text-[#7A827D]">
                {jobs.length} {jobs.length === 1 ? "active job" : "active jobs"}
              </p>
            )}
          </div>

          {jobError && (
            <div
              role="alert"
              className="mb-5 rounded-xl border border-red-200 bg-white p-5 text-sm text-red-700"
            >
              <p>{jobError}</p>
              <button
                type="button"
                onClick={loadData}
                className="mt-3 font-semibold underline"
              >
                Retry loading dashboard
              </button>
            </div>
          )}

          {loadingJobs ? (
            <div className="rounded-2xl border border-[#DCD8CC] bg-white p-10 text-center text-sm text-[#737B76]">
              Loading your job postings...
            </div>
          ) : jobs.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {jobs.map((job) => (
                <article
                  key={job._id}
                  className="rounded-2xl border border-[#DCD8CC] bg-white p-5 transition-all hover:border-[#9FBEAA] hover:shadow-sm sm:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#4F9669]" />
                        <span className="text-[11px] font-medium uppercase tracking-wider text-[#47725A]">
                          Published
                        </span>
                      </div>

                      <h3 className="font-serif text-xl leading-tight text-[#16241E] sm:text-2xl">
                        {job.title}
                      </h3>
                      <p className="mt-2 text-sm text-[#737B76]">
                        📍 {job.location || "Location not specified"}
                      </p>
                    </div>

                    <div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-[#F0F3EF] text-[#2F6F4E] sm:flex">
                      ✦
                    </div>
                  </div>

                  {job.description && (
                    <div className="mt-5 rounded-xl border border-[#E5E0D4] bg-[#F7F5EE] p-4">
                      <p className="mb-2 text-xs uppercase tracking-wide text-[#737B76]">
                        Job description
                      </p>
                      <p className="line-clamp-3 text-sm leading-6 text-[#3F4843]">
                        {job.description}
                      </p>
                    </div>
                  )}

                  {Array.isArray(job.skillsRequired) &&
                    job.skillsRequired.length > 0 && (
                      <div className="mt-3 rounded-xl border border-[#E0E9E2] bg-[#F4F7F3] p-4">
                        <p className="mb-3 text-xs uppercase tracking-wide text-[#47725A]">
                          Required skills
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {job.skillsRequired.map((skill, index) => (
                            <span
                              key={`${skill}-${index}`}
                              className="rounded-full border border-[#D7E3DA] bg-white px-3 py-1.5 text-xs text-[#2F6F4E]"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                  <div className="mt-5 rounded-xl border border-[#E0E9E2] bg-[#F4F7F3] p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E1EEE5] text-[#2F6F4E]">
                        ✦
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#2B4435]">
                          Smart matching enabled
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-[#748078]">
                          Candidates can be compared with this job based on
                          the skills and requirements in their resumes.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 border-t border-[#ECE9E1] pt-5 sm:grid-cols-2">
                    <Link
                      to={`/matches/job/${job._id}/candidates`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#2F6F4E] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#234F38]"
                    >
                      View matched candidates <span>→</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => openEditJob(job)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#2F6F4E] px-4 py-3 text-sm font-medium text-[#2F6F4E] transition-colors hover:bg-[#E7F0EA]"
                    >
                      Edit job <span>✎</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : !jobError ? (
            <div className="rounded-2xl border border-[#DCD8CC] bg-white p-8 text-center sm:p-12">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E7F0EA] text-2xl">
                ✦
              </div>
              <p className="mb-2 text-xs uppercase tracking-[0.16em] text-[#2F6F4E]">
                Start hiring with AI
              </p>
              <h3 className="font-serif text-2xl text-[#16241E] sm:text-3xl">
                Create your first job
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#737B76]">
                Post your requirements and SmartHire will help you identify
                candidates whose skills are relevant to the role.
              </p>
              <Link
                to="/jobs/new"
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#2F6F4E] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#234F38]"
              >
                + Post your first job
              </Link>
            </div>
          ) : null}
        </section>
      </main>

      {/* EDIT JOB MODAL */}
      {editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close edit job window"
            onClick={closeEditJob}
            className="absolute inset-0 bg-black/50"
          />

          <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-[#E5E0D4] bg-white px-5 py-5 sm:px-7">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[#2F6F4E]">
                  Job management
                </p>
                <h2 className="mt-1 font-serif text-2xl text-[#16241E] sm:text-3xl">
                  Edit job
                </h2>
              </div>

              <button
                type="button"
                onClick={closeEditJob}
                disabled={savingJob}
                className="h-9 w-9 rounded-full bg-[#F0F3EF] text-[#2F6F4E] transition-colors hover:bg-[#E7F0EA] disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateJob} className="space-y-5 p-5 sm:p-7">
              {jobError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {jobError}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-[#16241E]">
                  Job title
                </label>
                <input
                  type="text"
                  value={editingJob.title}
                  onChange={(event) =>
                    setEditingJob({
                      ...editingJob,
                      title: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-[#DCD8CC] px-4 py-3 text-sm text-[#16241E] outline-none focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/10"
                  placeholder="e.g. Python Backend Developer"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#16241E]">
                  Location
                </label>
                <input
                  type="text"
                  value={editingJob.location}
                  onChange={(event) =>
                    setEditingJob({
                      ...editingJob,
                      location: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-[#DCD8CC] px-4 py-3 text-sm text-[#16241E] outline-none focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/10"
                  placeholder="e.g. Enugu, Nigeria"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#16241E]">
                  Job description
                </label>
                <textarea
                  value={editingJob.description}
                  onChange={(event) =>
                    setEditingJob({
                      ...editingJob,
                      description: event.target.value,
                    })
                  }
                  rows={7}
                  className="w-full resize-y rounded-xl border border-[#DCD8CC] px-4 py-3 text-sm text-[#16241E] outline-none focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/10"
                  placeholder="Describe the role, responsibilities and expectations..."
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#16241E]">
                  Required skills
                </label>
                <input
                  type="text"
                  value={editingJob.skillsRequired}
                  onChange={(event) =>
                    setEditingJob({
                      ...editingJob,
                      skillsRequired: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-[#DCD8CC] px-4 py-3 text-sm text-[#16241E] outline-none focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/10"
                  placeholder="e.g. Python, Flask, MongoDB, REST API"
                />
                <p className="mt-2 text-xs text-[#7A827D]">
                  Separate each skill with a comma.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-[#ECE9E1] pt-3 sm:flex-row">
                <button
                  type="button"
                  onClick={closeEditJob}
                  disabled={savingJob}
                  className="flex-1 rounded-xl border border-[#DCD8CC] px-5 py-3 text-sm font-medium text-[#3F4843] transition-colors hover:bg-[#F7F5EE] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingJob}
                  className="flex-1 rounded-xl bg-[#2F6F4E] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#234F38] disabled:opacity-60"
                >
                  {savingJob ? "Saving changes..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}