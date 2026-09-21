import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";

export default function CandidatesList() {
  const { jobId } = useParams();
  const [candidates, setCandidates] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/matches/job/${jobId}/candidates`)
      .then((res) => setCandidates(res.data))
      .catch((err) => setError(err.response?.data?.error || "Failed to load candidates"));
  }, [jobId]);

  return (
    <div className="max-w-3xl mx-auto px-6 pt-12 pb-20">
      <h1 className="font-serif text-3xl text-ink mb-8">Ranked candidates</h1>
      {error && (
        <p className="text-sm text-ochre mb-4 border border-ochre/40 bg-ochre/5 px-3 py-2 rounded">
          {error}
        </p>
      )}
      <div className="card divide-y divide-line">
        {candidates.map((c, i) => (
          <div key={c._id} className="p-4 flex justify-between items-center">
            <div>
              <p className="font-medium text-ink">#{i + 1} — {c.jobSeeker?.name}</p>
              <p className="text-sm text-muted">{c.jobSeeker?.email}</p>
              <p className="text-xs text-muted mt-1">
                Keyword {(c.tfidfScore * 100).toFixed(0)}% · Semantic {(c.bertScore * 100).toFixed(0)}%
              </p>
            </div>
            <span className="font-serif text-2xl text-emerald">
              {(c.finalScore * 100).toFixed(0)}%
            </span>
          </div>
        ))}
        {candidates.length === 0 && !error && (
          <div className="p-4 text-sm text-muted">
            No candidates have matched against this job yet.
          </div>
        )}
      </div>
    </div>
  );
}
