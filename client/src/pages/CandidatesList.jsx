
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const API_ORIGIN = new URL(API_BASE_URL, window.location.origin).origin;

function getImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
}

function formatPercent(value) {
  if (value === null || value === undefined || value === "") return "—";

  const number = Number(value);
  if (!Number.isFinite(number)) return "—";

  const percentage = number <= 1 ? number * 100 : number;

  return `${Math.round(Math.min(100, Math.max(0, percentage)))}%`;
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getInitials(name) {
  if (!name || typeof name !== "string") return "A";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function CandidateAvatar({ name, photoUrl }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = getImageUrl(photoUrl);

  useEffect(() => {
    setImageFailed(false);
  }, [photoUrl]);

  return (
    <div className="w-16 h-16 shrink-0 overflow-hidden rounded-2xl border border-[#DCD8CC] bg-[#EAF2EB] text-[#2F6F4E] flex items-center justify-center font-semibold text-lg">
      {imageUrl && !imageFailed ? (
        <img
          src={imageUrl}
          alt={`${name}'s profile`}
          className="w-full h-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}

function ScoreBar({ value }) {
  const formatted = formatPercent(value);
  const percentage =
    formatted === "—" ? 0 : Number(formatted.replace("%", ""));

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-muted">Job compatibility</span>
        <span className="font-semibold text-emerald">{formatted}</span>
      </div>

      <div
        className="h-2 rounded-full bg-stone-100 overflow-hidden"
        role="progressbar"
        aria-label="Job compatibility"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
      >
        <div
          className="h-full rounded-full bg-emerald transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function CandidatesList() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState("");
  const [decisionSaving, setDecisionSaving] = useState("");
  const [decisionFilter, setDecisionFilter] = useState("all");

  useEffect(() => {
    let active = true;

    async function loadCandidates() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get(
          `/matches/job/${jobId}/candidates`
        );

        if (active) {
          setCandidates(
            Array.isArray(response.data) ? response.data : []
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.error ||
              "We couldn't load applicants. Please try again."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    if (jobId) {
      loadCandidates();
    } else {
      setError("The job ID is missing. Please return to your dashboard.");
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [jobId]);

  async function handleDownload(resumeId, fileName) {
    try {
      setDownloading(resumeId);

      const response = await api.get(
        `/resumes/${resumeId}/download`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");

      link.href = url;
      link.download = fileName || "Applicant-CV";
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      let message = "Failed to download applicant CV.";
      const data = err.response?.data;

      if (data instanceof Blob) {
        try {
          const payload = JSON.parse(await data.text());
          message = payload.error || payload.details || message;
        } catch {
          // Keep the fallback message.
        }
      } else if (data?.error || data?.details) {
        message = data.error || data.details;
      }

      window.alert(message);
    } finally {
      setDownloading("");
    }
  }

  async function updateDecision(candidate, decision) {
    if (!candidate?._id || !jobId) return;
    setDecisionSaving(candidate._id);
    try {
      const response = await api.patch(
        `/matches/job/${jobId}/candidates/${candidate._id}/decision`,
        { decision }
      );
      setCandidates((previous) => previous.map((item) =>
        item._id === candidate._id
          ? { ...item, employerDecision: response.data.employerDecision || decision }
          : item
      ));
    } catch (err) {
      window.alert(err.response?.data?.error || "Could not update this candidate. Please try again.");
    } finally {
      setDecisionSaving("");
    }
  }

  function handleViewProfile(candidate) {
    if (!candidate?._id || !jobId) {
      window.alert("Unable to open this candidate's profile.");
      return;
    }

    // Keep this URL consistent with the route in App.jsx.
    navigate(`/matches/job/${jobId}/candidates/${candidate._id}`);
  }

  return (
    <main className="min-h-screen bg-[#F7F5EE]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-20">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-9">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald mb-3">
              Employer workspace
            </p>

            <h1 className="font-serif text-3xl sm:text-4xl text-ink">
              Your applicants
            </h1>

            <p className="text-sm sm:text-base text-muted mt-3 max-w-xl leading-6">
              Review candidate profiles, compare compatibility, and
              download resumes to find the right person for your team.
            </p>
          </div>

          <div className="bg-white border border-[#DCD8CC] rounded-xl px-5 py-4 min-w-[150px]">
            <p className="text-xs text-muted uppercase tracking-wider">
              Total candidates
            </p>
            <p className="font-serif text-3xl text-ink mt-1">
              {loading ? "—" : candidates.length}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">
              Candidate ranking
            </h2>
            <p className="text-sm text-muted mt-1">
              Candidates are ranked by their compatibility score.
            </p>
          </div>

          {!loading && !error && candidates.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setDecisionFilter("all")} aria-pressed={decisionFilter === "all"} className={`rounded-full border px-3 py-2 text-xs font-semibold ${decisionFilter === "all" ? "border-[#2F6F4E] bg-[#2F6F4E] text-white" : "border-[#DCD8CC] bg-white text-[#526057]"}`}>All ({candidates.length})</button>
              <button type="button" onClick={() => setDecisionFilter("shortlisted")} aria-pressed={decisionFilter === "shortlisted"} className={`rounded-full border px-3 py-2 text-xs font-semibold ${decisionFilter === "shortlisted" ? "border-[#2F6F4E] bg-[#2F6F4E] text-white" : "border-[#DCD8CC] bg-white text-[#526057]"}`}>Shortlisted ({candidates.filter((candidate) => candidate.employerDecision === "shortlisted").length})</button>
            </div>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="bg-white border border-red-200 rounded-xl p-5 mb-5"
          >
            <p className="font-medium text-red-700">
              Unable to load candidates
            </p>
            <p className="text-sm text-muted mt-2">{error}</p>

            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                setError("");

                try {
                  const response = await api.get(
                    `/matches/job/${jobId}/candidates`
                  );

                  setCandidates(
                    Array.isArray(response.data) ? response.data : []
                  );
                } catch (err) {
                  setError(
                    err.response?.data?.error ||
                      "We couldn't load applicants. Please try again."
                  );
                } finally {
                  setLoading(false);
                }
              }}
              className="btn-primary text-sm mt-4"
            >
              Try again
            </button>
          </div>
        )}

        {loading && (
          <div className="bg-white border border-[#DCD8CC] rounded-xl p-12 text-center">
            <div className="w-9 h-9 border-2 border-[#DCD8CC] border-t-[#2F6F4E] rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-ink mt-4">
              Loading candidates...
            </p>
          </div>
        )}

        {!loading && !error && candidates.length === 0 && (
          <div className="bg-white border border-[#DCD8CC] rounded-xl px-6 py-16 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#EAF2EB] flex items-center justify-center text-2xl text-[#2F6F4E]">
              <span aria-hidden="true">◎</span>
            </div>

            <h3 className="font-serif text-xl text-ink mt-5">
              No candidates yet
            </h3>

            <p className="text-sm text-muted max-w-md mx-auto mt-2 leading-6">
              Candidates will appear here when matching records exist
              for this job.
            </p>
          </div>
        )}

        {!loading && !error && candidates.length > 0 && (
          <div className="space-y-4">
            {candidates.filter((candidate) => decisionFilter === "all" || candidate.employerDecision === "shortlisted").length === 0 && (
              <div className="rounded-2xl border border-[#DCD8CC] bg-white px-6 py-12 text-center">
                <h3 className="font-serif text-xl text-ink">No shortlisted candidates yet</h3>
                <p className="mt-2 text-sm text-muted">Choose “Shortlist candidate” on a promising applicant to save them here.</p>
                <button type="button" onClick={() => setDecisionFilter("all")} className="mt-4 text-sm font-semibold text-[#2F6F4E] underline">View all candidates</button>
              </div>
            )}
            {candidates.filter((candidate) => decisionFilter === "all" || candidate.employerDecision === "shortlisted").map((candidate, index) => {
              const profile = candidate.jobSeekerProfile;
              const user = candidate.jobSeeker;

              const name =
                profile?.fullName || user?.name || "Applicant";

              const phone = profile?.phone || user?.phone || "";
              const photoUrl = profile?.photoUrl || "";
              const resumeId = candidate.resume?._id;

              return (
                <article
                  key={candidate._id}
                  className="bg-white border border-[#DCD8CC] rounded-2xl p-5 sm:p-6 transition-shadow duration-200 hover:shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <CandidateAvatar name={name} photoUrl={photoUrl} />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-muted bg-[#F7F5EE] rounded-md px-2 py-1">
                            #{index + 1}
                          </span>

                          {index === 0 && (
                            <span className="text-xs font-medium text-[#2F6F4E] bg-[#EAF2EB] rounded-full px-2.5 py-1">
                              Top ranked
                            </span>
                          )}
                        </div>

                        <h3 className="font-semibold text-lg text-ink mt-2 break-words">
                          {name}
                        </h3>

                        {profile?.professionalTitle && (
                          <p className="text-sm text-[#2F6F4E] mt-1">
                            {profile.professionalTitle}
                          </p>
                        )}

                        <div className="flex flex-col gap-2 mt-3">
                          <p className="text-sm text-muted break-all">
                            <span className="text-ink font-medium">
                              Email:
                            </span>{" "}
                            {user?.email ? (
                              <a
                                href={`mailto:${user.email}`}
                                className="text-[#2F6F4E] underline underline-offset-2 hover:text-[#234F38]"
                              >
                                {user.email}
                              </a>
                            ) : (
                              "No email available"
                            )}
                          </p>

                          <p className="text-sm text-muted">
                            <span className="text-ink font-medium">
                              Phone:
                            </span>{" "}
                            {phone ? (
                              <a
                                href={`tel:${phone.replace(/[^+\d]/g, "")}`}
                                className="text-[#2F6F4E] underline underline-offset-2 hover:text-[#234F38]"
                              >
                                {phone}
                              </a>
                            ) : (
                              "Not provided"
                            )}
                          </p>

                          {profile?.location && (
                            <p className="text-sm text-muted">
                              <span className="text-ink font-medium">
                                Location:
                              </span>{" "}
                              {profile.location}
                            </p>
                          )}

                          <p className="text-sm text-muted">
                            <span className="text-ink font-medium">
                              Match date:
                            </span>{" "}
                            {formatDate(candidate.createdAt)}
                          </p>
                        </div>

                        <div className="max-w-md">
                          <ScoreBar value={candidate.finalScore} />
                        </div>

                        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 pt-4 border-t border-[#EEEAE0]">
                          <p className="text-xs text-muted">
                            Keyword score{" "}
                            <span className="font-semibold text-ink">
                              {formatPercent(candidate.tfidfScore)}
                            </span>
                          </p>

                          <p className="text-xs text-muted">
                            Semantic score{" "}
                            <span className="font-semibold text-ink">
                              {formatPercent(candidate.bertScore)}
                            </span>
                          </p>
                        </div>
                        {(candidate.matchedSkills?.length > 0 || candidate.missingSkills?.length > 0) && (
                          <div className="mt-4 rounded-xl border border-[#EEEAE0] bg-[#FDFCF9] p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#526057]">Skill comparison</p>
                            {candidate.matchedSkills?.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{candidate.matchedSkills.slice(0, 5).map((skill) => <span key={`matched-${skill}`} className="rounded-full bg-[#EAF2EB] px-2 py-1 text-[11px] text-[#2F6F4E]">✓ {skill}</span>)}</div>}
                            {candidate.missingSkills?.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{candidate.missingSkills.slice(0, 5).map((skill) => <span key={`missing-${skill}`} className="rounded-full bg-amber-50 px-2 py-1 text-[11px] text-amber-800">Needs: {skill}</span>)}</div>}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-stretch sm:items-end gap-4 sm:min-w-[175px] pt-4 sm:pt-0 border-t sm:border-t-0 border-[#EEEAE0]">
                      <div className="sm:text-right">
                        <p className="text-xs text-muted">
                          Compatibility
                        </p>
                        <p className="font-serif text-3xl text-emerald mt-1">
                          {formatPercent(candidate.finalScore)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleViewProfile(candidate)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[#2F6F4E] px-4 py-2.5 text-sm font-semibold text-[#2F6F4E] hover:bg-[#EAF2EB] transition-colors"
                      >
                        View Full Profile
                        <span aria-hidden="true">→</span>
                      </button>

                      <div className="flex flex-col gap-2 w-full sm:w-auto">
                        <span className={`rounded-full px-3 py-1.5 text-center text-xs font-semibold ${candidate.employerDecision === "shortlisted" ? "bg-[#EAF2EB] text-[#2F6F4E]" : candidate.employerDecision === "not_selected" ? "bg-stone-100 text-stone-600" : "bg-[#F7F5EE] text-[#526057]"}`}>
                          {candidate.employerDecision === "shortlisted" ? "Shortlisted" : candidate.employerDecision === "not_selected" ? "Not selected" : "Awaiting review"}
                        </span>
                        <button type="button" onClick={() => updateDecision(candidate, candidate.employerDecision === "shortlisted" ? "reviewing" : "shortlisted")} disabled={decisionSaving === candidate._id} className={`w-full sm:w-auto rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60 ${candidate.employerDecision === "shortlisted" ? "border border-[#DCD8CC] text-[#526057] hover:bg-[#F7F5EE]" : "bg-[#2F6F4E] text-white hover:bg-[#234F38]"}`}>
                          {decisionSaving === candidate._id ? "Saving…" : candidate.employerDecision === "shortlisted" ? "Remove from shortlist" : "Shortlist candidate"}
                        </button>
                        {candidate.employerDecision !== "not_selected" && <button type="button" onClick={() => updateDecision(candidate, "not_selected")} disabled={decisionSaving === candidate._id} className="w-full sm:w-auto rounded-xl border border-[#DCD8CC] px-4 py-2 text-xs font-semibold text-[#526057] hover:bg-[#F7F5EE] disabled:opacity-60">Mark not selected</button>}
                        {candidate.employerDecision === "not_selected" && <button type="button" onClick={() => updateDecision(candidate, "reviewing")} disabled={decisionSaving === candidate._id} className="w-full sm:w-auto rounded-xl border border-[#DCD8CC] px-4 py-2 text-xs font-semibold text-[#526057] hover:bg-[#F7F5EE] disabled:opacity-60">Return to review</button>}
                      </div>

                      {resumeId ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleDownload(
                              resumeId,
                              candidate.resume.fileName
                            )
                          }
                          disabled={downloading === resumeId}
                          className="btn-primary text-sm whitespace-nowrap disabled:opacity-60"
                        >
                          {downloading === resumeId
                            ? "Downloading..."
                            : "Download CV"}
                        </button>
                      ) : (
                        <span className="text-xs text-muted">
                          No resume available
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <p className="text-xs text-muted text-center mt-8 leading-5">
          Compatibility scores are estimates to support recruitment
          decisions. Review each candidate's qualifications before
          making a hiring decision.
        </p>
      </div>
    </main>
  );
}
