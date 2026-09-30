import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

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

  async function loadData() {
    try {
      const [jobsRes, profileRes] = await Promise.all([
        api.get("/jobs/mine"),
        api.get("/profile/employer"),
      ]);

      setJobs(jobsRes.data);
      setCompanyProfile(profileRes.data);
    } catch (error) {
      console.error("Unable to load employer dashboard:", error);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const companyName =
    companyProfile?.companyName ||
    user?.name ||
    "Your Company";

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

      setJobs((currentJobs) =>
        currentJobs.map((job) =>
          job._id === editingJob._id ? response.data.job : job
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

        {/* =========================
            AI HERO
        ========================== */}
        <section className="relative overflow-hidden rounded-3xl bg-[#14231C] text-white mb-8">

          <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full border border-[#5E9875]/30" />

          <div className="absolute right-8 top-8 w-40 h-40 rounded-full border border-[#5E9875]/20" />

          <div className="absolute -right-12 bottom-[-80px] w-56 h-56 rounded-full bg-[#2F6F4E]/20" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center p-6 sm:p-8 lg:p-12">

            <div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#294535] text-[#A9D0B7] text-xs font-medium mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7FC497]" />
                SmartHire AI
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl leading-tight">
                Find people who{" "}
                <span className="text-[#9FD0AF]">
                  fit the role.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-[#D4DFD9] leading-relaxed max-w-xl mt-4">
                SmartHire analyses job requirements and candidate skills
                to help you discover relevant talent faster.
              </p>

              <p className="text-xs text-[#AFC2B7] mt-5">
                {today}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">

                <Link
                  to="/jobs/new"
                  className="inline-flex items-center justify-center bg-[#F7F5EE] text-[#16241E] px-5 py-3 rounded-lg text-sm font-medium hover:bg-white transition-colors"
                >
                  + Post a job
                </Link>

                {jobs.length > 0 && (
                  <a
                    href="#job-postings"
                    className="inline-flex items-center justify-center border border-[#668A75] text-[#E2EBE6] px-5 py-3 rounded-lg text-sm font-medium hover:bg-[#294535] transition-colors"
                  >
                    View your jobs
                  </a>
                )}

              </div>

            </div>

            <div className="hidden lg:flex justify-center">

              <div className="relative w-72 h-64">

                <div className="absolute left-8 top-20 w-24 border-t border-[#557C65]" />
                <div className="absolute right-8 top-20 w-24 border-t border-[#557C65]" />
                <div className="absolute left-1/2 top-8 h-12 border-l border-[#557C65]" />
                <div className="absolute left-1/2 bottom-8 h-12 border-l border-[#557C65]" />

                <div className="absolute left-0 top-12 w-20 h-20 rounded-2xl bg-[#22382C] border border-[#52745F] flex flex-col items-center justify-center">
                  <span className="text-xl">👤</span>
                  <span className="text-[10px] text-[#BFD1C7] mt-1">
                    Candidate
                  </span>
                </div>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-[#2F6F4E] border-4 border-[#406B53] flex flex-col items-center justify-center shadow-lg">
                  <span className="text-2xl">✦</span>
                  <span className="text-[10px] text-white mt-1">
                    AI Match
                  </span>
                </div>

                <div className="absolute right-0 top-12 w-20 h-20 rounded-2xl bg-[#22382C] border border-[#52745F] flex flex-col items-center justify-center">
                  <span className="text-xl">💼</span>
                  <span className="text-[10px] text-[#BFD1C7] mt-1">
                    Job
                  </span>
                </div>

                <div className="absolute left-1/2 bottom-0 -translate-x-1/2 px-4 py-2 rounded-full bg-[#E7F0EA] text-[#2F6F4E] text-xs font-semibold">
                  Compatibility
                </div>

              </div>

            </div>

          </div>
        </section>


        {/* =========================
            COMPANY PROFILE
        ========================== */}
        <section className="bg-white border border-[#DCD8CC] rounded-2xl p-5 sm:p-6 mb-8">

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">

            <div className="flex items-center gap-4 min-w-0">

              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#E7F0EA] border border-[#DCD8CC] overflow-hidden flex items-center justify-center text-3xl shrink-0">

                {companyProfile?.logoUrl ? (
                  <img
                    src={companyProfile.logoUrl}
                    alt="Company Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>🏢</span>
                )}

              </div>

              <div className="min-w-0">

                <p className="text-xs uppercase tracking-[0.16em] text-[#2F6F4E] mb-1">
                  Your company
                </p>

                <h2 className="font-serif text-2xl sm:text-3xl text-[#16241E] break-words">
                  {companyName}
                </h2>

                {companyProfile ? (
                  <p className="text-sm text-[#737B76] mt-1">
                    {companyProfile.industry || "Company profile"}
                    {companyProfile.location
                      ? ` • ${companyProfile.location}`
                      : ""}
                  </p>
                ) : (
                  <p className="text-sm text-[#737B76] mt-1">
                    Create your company profile to help candidates
                    learn more about your organisation.
                  </p>
                )}

              </div>

            </div>

            <Link
              to="/profile/employer"
              className="inline-flex items-center justify-center bg-[#2F6F4E] text-white px-5 py-3 rounded-lg text-sm font-medium hover:bg-[#234F38] transition-colors whitespace-nowrap"
            >
              {companyProfile
                ? "Edit Company Profile"
                : "Create Company Profile"}
            </Link>

          </div>

          {companyProfile && (
            <div className="mt-6 pt-6 border-t border-[#DCD8CC]">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                {companyProfile.contactName && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#737B76]">
                      Contact Person
                    </p>
                    <p className="text-sm text-[#16241E] mt-1">
                      {companyProfile.contactName}
                    </p>
                  </div>
                )}

                {companyProfile.email && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#737B76]">
                      Email
                    </p>
                    <p className="text-sm text-[#16241E] mt-1 break-all">
                      {companyProfile.email}
                    </p>
                  </div>
                )}

                {companyProfile.phone && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#737B76]">
                      Phone
                    </p>
                    <p className="text-sm text-[#16241E] mt-1">
                      {companyProfile.phone}
                    </p>
                  </div>
                )}

                {companyProfile.location && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#737B76]">
                      Location
                    </p>
                    <p className="text-sm text-[#16241E] mt-1">
                      {companyProfile.location}
                    </p>
                  </div>
                )}

                {companyProfile.industry && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#737B76]">
                      Industry
                    </p>
                    <p className="text-sm text-[#16241E] mt-1">
                      {companyProfile.industry}
                    </p>
                  </div>
                )}

                {companyProfile.website && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#737B76]">
                      Website
                    </p>

                    <a
                      href={companyProfile.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-[#2F6F4E] mt-1 block hover:underline break-all"
                    >
                      {companyProfile.website}
                    </a>
                  </div>
                )}

              </div>

              {companyProfile.description && (
                <div className="mt-5 pt-5 border-t border-[#ECE9E1]">

                  <p className="text-xs uppercase tracking-wide text-[#737B76]">
                    About the Company
                  </p>

                  <p className="text-sm text-[#16241E] mt-2 leading-6">
                    {companyProfile.description}
                  </p>

                </div>
              )}

            </div>
          )}

        </section>


        {/* =========================
            STATS
        ========================== */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">

          <div className="bg-white border border-[#DCD8CC] rounded-2xl p-5 sm:p-6">

            <p className="text-xs uppercase tracking-wider text-[#7A827D]">
              Active jobs
            </p>

            <div className="flex items-end justify-between mt-2">

              <p className="font-serif text-4xl text-[#16241E]">
                {jobs.length}
              </p>

              <div className="w-10 h-10 rounded-full bg-[#E7F0EA] flex items-center justify-center text-[#2F6F4E]">
                💼
              </div>

            </div>

            <p className="text-xs text-[#8A918D] mt-1">
              Current job postings
            </p>

          </div>


          <div className="bg-[#E7F0EA] border border-[#C9DACF] rounded-2xl p-5 sm:p-6">

            <p className="text-xs uppercase tracking-wider text-[#47725A]">
              Matching engine
            </p>

            <div className="flex items-end justify-between mt-2">

              <p className="font-serif text-2xl text-[#16241E]">
                AI-powered
              </p>

              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#2F6F4E]">
                ✦
              </div>

            </div>

            <p className="text-xs text-[#66806F] mt-2">
              Skills and job compatibility
            </p>

          </div>


          <div className="bg-white border border-[#DCD8CC] rounded-2xl p-5 sm:p-6">

            <p className="text-xs uppercase tracking-wider text-[#7A827D]">
              Hiring workflow
            </p>

            <div className="flex items-end justify-between mt-2">

              <p className="font-serif text-2xl text-[#16241E]">
                Simple
              </p>

              <div className="w-10 h-10 rounded-full bg-[#F0F3EF] flex items-center justify-center text-[#2F6F4E]">
                ✓
              </div>

            </div>

            <p className="text-xs text-[#8A918D] mt-2">
              Post → Match → Review
            </p>

          </div>

        </section>


        {/* =========================
            JOB POSTINGS
        ========================== */}
        <section id="job-postings">

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">

            <div>

              <p className="text-xs uppercase tracking-[0.16em] text-[#2F6F4E] mb-1">
                AI-assisted hiring
              </p>

              <h2 className="font-serif text-2xl sm:text-3xl text-[#16241E]">
                Your job postings
              </h2>

            </div>

            {jobs.length > 0 && (
              <p className="text-xs text-[#7A827D]">
                {jobs.length}{" "}
                {jobs.length === 1
                  ? "active job"
                  : "active jobs"}
              </p>
            )}

          </div>


          {jobs.length > 0 ? (

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {jobs.map((job) => (

                <article
                  key={job._id}
                  className="bg-white border border-[#DCD8CC] rounded-2xl p-5 sm:p-6 hover:border-[#9FBEAA] hover:shadow-sm transition-all"
                >

                  <div className="flex items-start justify-between gap-4">

                    <div className="min-w-0">

                      <div className="flex items-center gap-2 mb-3">

                        <span className="w-2 h-2 rounded-full bg-[#4F9669]" />

                        <span className="text-[11px] uppercase tracking-wider text-[#47725A] font-medium">
                          Published
                        </span>

                      </div>

                      <h3 className="font-serif text-xl sm:text-2xl text-[#16241E] leading-tight">
                        {job.title}
                      </h3>

                      <p className="text-sm text-[#737B76] mt-2">
                        📍 {job.location || "Location not specified"}
                      </p>

                    </div>

                    <div className="hidden sm:flex w-10 h-10 rounded-xl bg-[#F0F3EF] items-center justify-center text-[#2F6F4E]">
                      ✦
                    </div>

                  </div>


                  {/* JOB DESCRIPTION */}
                  {job.description && (
                    <div className="mt-5 rounded-xl bg-[#F7F5EE] border border-[#E5E0D4] p-4">

                      <p className="text-xs uppercase tracking-wide text-[#737B76] mb-2">
                        Job description
                      </p>

                      <p className="text-sm text-[#3F4843] leading-6 line-clamp-3">
                        {job.description}
                      </p>

                    </div>
                  )}


                  {/* REQUIRED SKILLS */}
                  {Array.isArray(job.skillsRequired) &&
                    job.skillsRequired.length > 0 && (
                      <div className="mt-3 rounded-xl bg-[#F4F7F3] border border-[#E0E9E2] p-4">

                        <p className="text-xs uppercase tracking-wide text-[#47725A] mb-3">
                          Required skills
                        </p>

                        <div className="flex flex-wrap gap-2">

                          {job.skillsRequired.map((skill, index) => (
                            <span
                              key={`${skill}-${index}`}
                              className="px-3 py-1.5 rounded-full bg-white border border-[#D7E3DA] text-xs text-[#2F6F4E]"
                            >
                              {skill}
                            </span>
                          ))}

                        </div>

                      </div>
                    )}


                  {/* AI EXPLANATION */}
                  <div className="mt-5 rounded-xl bg-[#F4F7F3] border border-[#E0E9E2] p-4">

                    <div className="flex items-start gap-3">

                      <div className="w-8 h-8 rounded-full bg-[#E1EEE5] flex items-center justify-center text-[#2F6F4E] shrink-0">
                        ✦
                      </div>

                      <div>

                        <p className="text-sm font-medium text-[#2B4435]">
                          Smart matching enabled
                        </p>

                        <p className="text-xs text-[#748078] mt-1 leading-relaxed">
                          Candidates can be compared with this job based
                          on the skills and requirements in their resumes.
                        </p>

                      </div>

                    </div>

                  </div>


                  {/* ACTIONS */}
                  <div className="border-t border-[#ECE9E1] mt-5 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">

                    <Link
                      to={`/jobs/${job._id}/candidates`}
                      className="w-full inline-flex items-center justify-center gap-2 bg-[#2F6F4E] text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-[#234F38] transition-colors"
                    >
                      View matched candidates
                      <span>→</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => openEditJob(job)}
                      className="w-full inline-flex items-center justify-center gap-2 border border-[#2F6F4E] text-[#2F6F4E] px-4 py-3 rounded-lg text-sm font-medium hover:bg-[#E7F0EA] transition-colors"
                    >
                      Edit job
                      <span>✎</span>
                    </button>

                  </div>

                </article>

              ))}

            </div>

          ) : (

            <div className="bg-white border border-[#DCD8CC] rounded-2xl p-8 sm:p-12 text-center">

              <div className="w-16 h-16 rounded-2xl bg-[#E7F0EA] flex items-center justify-center mx-auto mb-5 text-2xl">
                ✦
              </div>

              <p className="text-xs uppercase tracking-[0.16em] text-[#2F6F4E] mb-2">
                Start hiring with AI
              </p>

              <h3 className="font-serif text-2xl sm:text-3xl text-[#16241E]">
                Create your first job
              </h3>

              <p className="text-sm text-[#737B76] max-w-md mx-auto mt-3 leading-relaxed">
                Post your requirements and SmartHire will help you
                identify candidates whose skills are relevant to the role.
              </p>

              <Link
                to="/jobs/new"
                className="inline-flex items-center justify-center bg-[#2F6F4E] text-white px-5 py-3 rounded-lg text-sm font-medium mt-6 hover:bg-[#234F38] transition-colors"
              >
                + Post your first job
              </Link>

            </div>

          )}

        </section>

      </main>


      {/* =========================
          EDIT JOB MODAL
      ========================== */}
      {editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

          <button
            type="button"
            aria-label="Close edit job window"
            onClick={closeEditJob}
            className="absolute inset-0 bg-black/50"
          />

          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">

            <div className="sticky top-0 bg-white border-b border-[#E5E0D4] px-5 sm:px-7 py-5 flex items-center justify-between">

              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[#2F6F4E]">
                  Job management
                </p>

                <h2 className="font-serif text-2xl sm:text-3xl text-[#16241E] mt-1">
                  Edit job
                </h2>
              </div>

              <button
                type="button"
                onClick={closeEditJob}
                disabled={savingJob}
                className="w-9 h-9 rounded-full bg-[#F0F3EF] text-[#2F6F4E] hover:bg-[#E7F0EA] transition-colors disabled:opacity-50"
              >
                ✕
              </button>

            </div>


            <form
              onSubmit={handleUpdateJob}
              className="p-5 sm:p-7 space-y-5"
            >

              {jobError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {jobError}
                </div>
              )}


              {/* TITLE */}
              <div>
                <label className="block text-sm font-medium text-[#16241E] mb-2">
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
                  className="w-full border border-[#DCD8CC] rounded-xl px-4 py-3 text-sm text-[#16241E] outline-none focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/10"
                  placeholder="e.g. Python Backend Developer"
                  required
                />
              </div>


              {/* LOCATION */}
              <div>
                <label className="block text-sm font-medium text-[#16241E] mb-2">
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
                  className="w-full border border-[#DCD8CC] rounded-xl px-4 py-3 text-sm text-[#16241E] outline-none focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/10"
                  placeholder="e.g. Enugu, Nigeria"
                />
              </div>


              {/* DESCRIPTION */}
              <div>
                <label className="block text-sm font-medium text-[#16241E] mb-2">
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
                  className="w-full border border-[#DCD8CC] rounded-xl px-4 py-3 text-sm text-[#16241E] outline-none resize-y focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/10"
                  placeholder="Describe the role, responsibilities and expectations..."
                  required
                />
              </div>


              {/* SKILLS */}
              <div>
                <label className="block text-sm font-medium text-[#16241E] mb-2">
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
                  className="w-full border border-[#DCD8CC] rounded-xl px-4 py-3 text-sm text-[#16241E] outline-none focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/10"
                  placeholder="e.g. Python, Flask, MongoDB, REST API"
                />

                <p className="text-xs text-[#7A827D] mt-2">
                  Separate each skill with a comma.
                </p>
              </div>


              {/* BUTTONS */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-3 border-t border-[#ECE9E1]">

                <button
                  type="button"
                  onClick={closeEditJob}
                  disabled={savingJob}
                  className="flex-1 border border-[#DCD8CC] text-[#3F4843] px-5 py-3 rounded-xl text-sm font-medium hover:bg-[#F7F5EE] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingJob}
                  className="flex-1 bg-[#2F6F4E] text-white px-5 py-3 rounded-xl text-sm font-medium hover:bg-[#234F38] transition-colors disabled:opacity-60"
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