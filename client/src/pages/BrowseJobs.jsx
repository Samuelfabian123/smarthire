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
      setError(err.response?.data?.error || "Matching failed. Upload a resume first.");
    } finally {
      setMatchingId(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 pt-12 pb-20">
      <h1 className="font-serif text-3xl text-ink mb-8">Browse jobs</h1>
      {error && (
        <p className="text-sm text-ochre mb-4 border border-ochre/40 bg-ochre/5 px-3 py-2 rounded">
          {error}
        </p>
      )}
      <div className="card divide-y divide-line">
        {jobs.map((job) => (
          <div key={job._id} className="p-4">
            <div className="flex justify-between items-start gap-4">
              <div>
                <p className="font-medium text-ink">{job.title}</p>
                <p className="text-sm text-muted">{job.location}</p>
                <p className="text-sm text-ink mt-2 leading-relaxed">
                  {job.description.slice(0, 160)}…
                </p>
              </div>
              <div className="text-right shrink-0">
                {scores[job._id] !== undefined ? (
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
          <div className="p-4 text-sm text-muted">No jobs posted yet.</div>
        )}
      </div>
    </div>
  );
}
