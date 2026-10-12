import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";

export default function CandidatesList() {
  const { jobId } = useParams();
  const [candidates, setCandidates] = useState([]);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState("");

  useEffect(() => {
    api
      .get(`/matches/job/${jobId}/candidates`)
      .then((res) => setCandidates(res.data))
      .catch((err) =>
        setError(
          err.response?.data?.error || "Failed to load candidates"
        )
      );
  }, [jobId]);

  async function handleDownload(resumeId, fileName) {
    try {
      setDownloading(resumeId);

      const response = await api.get(
        `/resumes/${resumeId}/download`,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data]);

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || "Applicant-CV";
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err) {
      let message = err.response?.data?.error || "Failed to download applicant CV";
      const responseData = err.response?.data;

      if (responseData instanceof Blob) {
        try {
          const payload = JSON.parse(await responseData.text());
          message = payload.error || payload.details || message;
        } catch {
          // Keep the generic message when the response body is not JSON.
        }
      } else if (responseData?.details) {
        message = responseData.details;
      }

      alert(message);
    } finally {
      setDownloading("");
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-20">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-wider text-emerald mb-2">
          Employer
        </p>

        <h1 className="font-serif text-3xl text-ink">
          Applicants
        </h1>

        <p className="text-sm text-muted mt-2">
          Candidates ranked by their compatibility with this job.
        </p>
      </div>

      {error && (
        <p className="text-sm text-ochre mb-4 border border-ochre/40 bg-ochre/5 px-3 py-2 rounded">
          {error}
        </p>
      )}

      <div className="card divide-y divide-line overflow-hidden">
        {candidates.map((c, i) => (
          <div
            key={c._id}
            className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-muted">
                  #{i + 1}
                </span>

                <p className="font-medium text-ink">
                  {c.jobSeeker?.name || "Applicant"}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted">
                  📧 {c.jobSeeker?.email || "No email available"}
                </p>

                <p className="text-sm text-muted">
                  📱{" "}
                  {c.jobSeeker?.phone
                    ? c.jobSeeker.phone
                    : "No phone number provided"}
                </p>

                <p className="text-xs text-muted mt-2">
                  Keyword{" "}
                  {(c.tfidfScore * 100).toFixed(0)}%
                  {" · "}
                  Semantic{" "}
                  {(c.bertScore * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3 shrink-0">
              <span className="font-serif text-2xl text-emerald">
                {(c.finalScore * 100).toFixed(0)}%
              </span>

              {c.resume?._id && (
                <button
                  type="button"
                  onClick={() =>
                    handleDownload(
                      c.resume._id,
                      c.resume.fileName
                    )
                  }
                  disabled={downloading === c.resume._id}
                  className="btn-primary text-sm whitespace-nowrap disabled:opacity-60"
                >
                  {downloading === c.resume._id
                    ? "Downloading…"
                    : "Download CV"}
                </button>
              )}
            </div>
          </div>
        ))}

        {candidates.length === 0 && !error && (
          <div className="p-6 text-sm text-muted text-center">
            No candidates have matched against this job yet.
          </div>
        )}
      </div>
    </div>
  );
}