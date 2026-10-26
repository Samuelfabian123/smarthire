
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api/axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const API_ORIGIN = new URL(API_BASE_URL, window.location.origin).origin;

function getImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
}

function formatPercent(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const number = Number(value);
  if (!Number.isFinite(number)) return "—";

  const percentage = number <= 1 ? number * 100 : number;

  return `${Math.round(Math.min(100, Math.max(0, percentage)))}%`;
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  if (Array.isArray(value)) {
    return value.length
      ? value.map((item) => formatValue(item)).join(", ")
      : "Not provided";
  }

  if (typeof value === "object") {
    return (
      Object.entries(value)
        .filter(
          ([, item]) =>
            item !== null && item !== undefined && item !== ""
        )
        .map(([key, item]) => {
          const label = key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (char) => char.toUpperCase());

          return `${label}: ${formatValue(item)}`;
        })
        .join("\n") || "Not provided"
    );
  }

  return String(value);
}

function Section({ title, children }) {
  return (
    <section className="bg-white border border-[#DCD8CC] rounded-2xl p-5 sm:p-7">
      <h2 className="font-serif text-xl text-[#24352B] mb-4">
        {title}
      </h2>
      {children}
    </section>
  );
}

function DetailText({ children }) {
  return (
    <p className="text-sm text-[#59645C] leading-7 whitespace-pre-wrap break-words">
      {formatValue(children)}
    </p>
  );
}

export default function CandidateDetails() {
  const { jobId, candidateId } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadCandidate() {
      if (!jobId || !candidateId) {
        setError("The job or candidate ID is missing.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await api.get(
          `/matches/job/${jobId}/candidates/${candidateId}`
        );

        if (active) {
          setPhotoFailed(false);
          setData(response.data);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.error ||
              "Unable to load this candidate's profile."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadCandidate();

    return () => {
      active = false;
    };
  }, [jobId, candidateId, retryCount]);

  async function downloadCV(resumeId, fileName) {
    try {
      setDownloading(true);

      const response = await api.get(
        `/resumes/${resumeId}/download`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");

      link.href = url;
      link.download = fileName || "Candidate-CV";
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(
        () => window.URL.revokeObjectURL(url),
        1000
      );
    } catch (err) {
      let message = "Unable to download the CV.";
      const responseData = err.response?.data;

      if (responseData instanceof Blob) {
        try {
          const payload = JSON.parse(await responseData.text());
          message = payload.error || payload.details || message;
        } catch {
          // Keep the fallback message.
        }
      } else if (responseData?.error || responseData?.details) {
        message = responseData.error || responseData.details;
      }

      window.alert(message);
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F5EE] px-4 py-8">
        <div className="flex items-center gap-3 rounded-2xl border border-[#DCD8CC] bg-white px-6 py-5 shadow-sm" role="status" aria-live="polite">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#DCD8CC] border-t-[#2F6F4E]" />
          <span className="text-sm font-medium text-[#59645C]">Loading candidate profile…</span>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-[#F7F5EE] px-5 py-12">
        <div className="max-w-3xl mx-auto bg-white border border-[#DCD8CC] rounded-2xl p-7">
          <h1 className="font-serif text-2xl text-[#24352B]">
            Candidate profile unavailable
          </h1>

          <p className="text-sm text-red-600 mt-3" role="alert">
            {error || "No candidate information was returned."}
          </p>

          {jobId && candidateId && (
            <button
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
              className="mt-5 inline-flex rounded-xl bg-[#2F6F4E] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#234F38]"
            >
              Try loading again
            </button>
          )}

          <Link
            to={`/matches/job/${jobId}/candidates`}
            className="inline-block mt-6 text-sm font-semibold text-[#2F6F4E] hover:underline"
          >
            ← Back to applicants
          </Link>
        </div>
      </main>
    );
  }

  const match = data.match || {};
  const profile = data.jobSeekerProfile || {};
  const user = match.jobSeeker || {};
  const resume = match.resume || {};

  const name = profile.fullName || user.name || "Applicant";
  const email = user.email || profile.email || "";
  const phone = profile.phone || user.phone || "";
  const photoUrl = getImageUrl(profile.photoUrl);

  const skills = Array.isArray(profile.skills)
    ? profile.skills
    : typeof profile.skills === "string"
      ? profile.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean)
      : [];

  const matchedSkills = Array.isArray(match.matchedSkills)
    ? match.matchedSkills
    : [];

  const missingSkills = Array.isArray(match.missingSkills)
    ? match.missingSkills
    : [];

  const gmailUrl = email
    ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`
    : null;

  return (
    <main className="min-h-screen bg-[#F7F5EE]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link
          to={`/matches/job/${jobId}/candidates`}
          className="inline-flex text-sm font-semibold text-[#2F6F4E] hover:underline mb-6"
        >
          ← Back to applicants
        </Link>

        <section className="bg-white border border-[#DCD8CC] rounded-2xl p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row gap-5 sm:items-center">
            <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-[#EAF2EB] border border-[#DCD8CC] flex items-center justify-center text-3xl font-semibold text-[#2F6F4E]">
              {photoUrl && !photoFailed ? (
                <img
                  src={photoUrl}
                  alt={`${name}'s profile`}
                  className="w-full h-full object-cover"
                  onError={() => setPhotoFailed(true)}
                />
              ) : (
                name
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0] || "")
                  .join("")
                  .toUpperCase()
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-[0.18em] font-semibold text-[#2F6F4E]">
                Candidate profile
              </p>

              <h1 className="font-serif text-3xl sm:text-4xl text-[#24352B] mt-2 break-words">
                {name}
              </h1>

              <p className="text-[#2F6F4E] mt-2">
                {profile.professionalTitle || "Professional"}
              </p>

              <p className="text-sm text-[#59645C] mt-2">
                {formatValue(profile.location)}
              </p>
            </div>

            <div className="sm:text-right rounded-xl bg-[#EAF2EB] p-4">
              <p className="text-xs text-[#59645C]">
                Job compatibility
              </p>

              <p className="font-serif text-4xl text-[#2F6F4E] mt-1">
                {formatPercent(match.finalScore)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6 pt-5 border-t border-[#EEEAE0]">
            {gmailUrl ? (
              <a
                href={gmailUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-[#2F6F4E] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#24563C]"
              >
                Email candidate in Gmail
              </a>
            ) : (
              <span className="text-sm text-[#59645C] self-center">
                No email address available
              </span>
            )}

            {resume._id ? (
              <button
                type="button"
                onClick={() => downloadCV(resume._id, resume.fileName)}
                disabled={downloading}
                className="inline-flex items-center justify-center rounded-lg border border-[#DCD8CC] text-[#24352B] px-4 py-2.5 text-sm font-semibold hover:bg-[#F7F5EE] disabled:opacity-60"
              >
                {downloading ? "Downloading..." : "Download CV"}
              </button>
            ) : (
              <span className="text-sm text-[#59645C] self-center">
                No CV attached to this match
              </span>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Section title="Contact information">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#7A827A]">
                  Email
                </p>
                <DetailText>{email}</DetailText>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#7A827A]">
                  Phone
                </p>

                {phone ? (
                  <a
                    href={`tel:${phone}`}
                    className="text-sm text-[#2F6F4E] break-all hover:underline"
                  >
                    {phone}
                  </a>
                ) : (
                  <DetailText>Not provided</DetailText>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#7A827A]">
                  Location
                </p>
                <DetailText>{profile.location}</DetailText>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#7A827A]">
                  Portfolio
                </p>

                {profile.portfolio ? (
                  <a
                    href={
                      /^https?:\/\//i.test(profile.portfolio)
                        ? profile.portfolio
                        : `https://${profile.portfolio}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#2F6F4E] break-all hover:underline"
                  >
                    {profile.portfolio}
                  </a>
                ) : (
                  <DetailText>Not provided</DetailText>
                )}
              </div>
            </div>
          </Section>

          <Section title="About the candidate">
            <DetailText>{profile.about}</DetailText>
          </Section>

          <Section title="Skills">
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <span
                    key={`${skill}-${index}`}
                    className="bg-[#EAF2EB] text-[#2F6F4E] border border-[#D5E5D8] rounded-full px-3 py-1.5 text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <DetailText>Skills not provided</DetailText>
            )}
          </Section>

          <Section title="Education">
            <DetailText>{profile.education}</DetailText>
          </Section>

          <Section title="Experience">
            <DetailText>{profile.experience}</DetailText>
          </Section>

          <Section title="AI matching insights">
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold text-[#24352B] mb-2">
                  Matched skills
                </p>

                {matchedSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {matchedSkills.map((skill, index) => (
                      <span
                        key={`${skill}-${index}`}
                        className="rounded-full bg-[#EAF2EB] text-[#2F6F4E] px-3 py-1.5 text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <DetailText>No matched skills recorded</DetailText>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-[#24352B] mb-2">
                  Skills to develop
                </p>

                {missingSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {missingSkills.map((skill, index) => (
                      <span
                        key={`${skill}-${index}`}
                        className="rounded-full bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <DetailText>No missing skills recorded</DetailText>
                )}
              </div>

              <div className="border-t border-[#EEEAE0] pt-4 space-y-2">
                <p className="text-sm text-[#59645C]">
                  Keyword score:{" "}
                  <strong className="text-[#24352B]">
                    {formatPercent(match.tfidfScore)}
                  </strong>
                </p>

                <p className="text-sm text-[#59645C]">
                  Semantic score:{" "}
                  <strong className="text-[#24352B]">
                    {formatPercent(match.bertScore)}
                  </strong>
                </p>

                <p className="text-xs text-[#7A827A] leading-5">
                  Scores are estimates to support recruitment. Review the
                  candidate's qualifications and CV before making a decision.
                </p>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </main>
  );
}
