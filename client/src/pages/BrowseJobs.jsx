import { useEffect, useState } from "react";
import api from "../api/axios";

export default function BrowseJobs() {
  const [jobs, setJobs] = useState([]);
  const [matchingId, setMatchingId] = useState(null);
  const [scores, setScores] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/jobs").then((res) => setJobs(res.data)).catch(console.error);
  }, []);

  async function handleMatch(jobId) {
    setMatchingId(jobId);
    setError("");
    try {
      const { data } = await api.post(`/matches/job/${jobId}`);
      setScores((prev) => ({ ...prev, [jobId]: data.match.finalScore }));
    } catch (err) {
      const apiError = err.response?.data;
      const message = apiError?.details
        ? `${apiError.error || "Matching failed"}: ${apiError.details}`
        : apiError?.error || err.message || "Matching failed. Upload a resume first.";
      setError(message);
    } finally {
      setMatchingId(null);
    }
  }

  async function handleExternalMatch(job) {
    setMatchingId(job._id);
    setError("");
    try {
      const { data } = await api.post("/matches/external", {
        title: job.title,
        description: job.description || "",
        skillsRequired: job.skillsRequired || [],
      });
      setScores((prev) => ({ ...prev, [job._id]: data.finalScore }));
    } catch (err) {
      setError(err.response?.data?.error || "Unable to match this vacancy. Upload a CV and try again.");
    } finally {
      setMatchingId(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 pt-12 pb-20">
      <h1 className="font-serif text-3xl text-ink mb-2">Discover your next opportunity</h1>
      <p className="text-sm text-muted mb-8">Live vacancies from SmartHire employers and external job sources. External applications open on the original job site.</p>
      {error && (
        <p className="text-sm text-ochre mb-4 border border-ochre/40 bg-ochre/5 px-3 py-2 rounded">
          {error}
        </p>
      )}
      <div className="card divide-y divide-line">
        {jobs.map((job) => (
          <div key={job._id} className="p-4 sm:p-5">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">{job.title}</p>
                <p className="text-sm text-muted">{job.company || job.employer?.companyName || job.employer?.name || "Hiring employer"}</p>
                <p className="text-sm text-muted">{job.location || "Location not specified"}</p>
                <p className="mt-2 text-xs text-muted">{job.external ? "External live listing" : "Posted on SmartHire"}</p>
                <p className="text-sm text-ink mt-2 leading-relaxed">
                  {(job.description || "Open the listing for more details.").replace(/<[^>]*>/g, " ").slice(0, 160)}…
                </p>
              </div>
              <div className="flex w-full shrink-0 flex-col items-start gap-2 sm:w-auto sm:items-end">
                {job.external ? (
                  <>
                    {scores[job._id] !== undefined ? (
                      <p className="font-serif text-xl text-emerald">{(Number(scores[job._id]) * 100).toFixed(0)}% AI match</p>
                    ) : (
                      <button onClick={() => handleExternalMatch(job)} disabled={matchingId === job._id} className="btn-secondary text-sm py-1.5 px-3">
                        {matchingId === job._id ? "Scoring…" : "Check AI match"}
                      </button>
                    )}
                    <a href={job.applyUrl || job.sourceJobUrl} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm py-1.5 px-3">Apply / view job ↗</a>
                    <a href={job.sourceUrl || job.sourceJobUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted underline">via {job.source || "original source"}</a>
                  </>
                ) : scores[job._id] !== undefined ? (
                  <p className="font-serif text-2xl text-emerald">
                    {(scores[job._id] * 100).toFixed(0)}%
                  </p>
                ) : (
                  <button
                    onClick={() => handleMatch(job._id)}
                    disabled={matchingId === job._id}
                    className="btn-secondary text-sm py-1.5 px-3"
                  >
                    {matchingId === job._id ? "Scoring…" : "Check match"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {jobs.length === 0 && (
          <div className="p-4 text-sm text-muted">No jobs are available right now. Please check back shortly.</div>
        )}
      </div>
    </div>
  );
}
