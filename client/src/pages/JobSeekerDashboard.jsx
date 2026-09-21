import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const today = new Date().toLocaleDateString("en-NG", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default function JobSeekerDashboard() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [matches, setMatches] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    try {
      const [resumeRes, matchRes] = await Promise.all([
        api.get("/resumes/mine"),
        api.get("/matches/mine"),
      ]);
      setResumes(resumeRes.data);
      setMatches(matchRes.data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("resume", file);
      await api.post("/resumes/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("Resume uploaded.");
      setFile(null);
      loadData();
    } catch (err) {
      setMessage(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 pt-12 pb-20">
      <p className="text-xs text-muted mb-1">{today}</p>
      <h1 className="font-serif text-3xl text-ink mb-8">Welcome, {user?.name?.split(" ")[0]}</h1>

      <section className="mb-10">
        <h2 className="font-serif text-xl text-ink mb-4">Your resume</h2>
        <form onSubmit={handleUpload} className="flex flex-wrap gap-3 items-center mb-4">
          <input
            type="file"
            accept=".pdf,.docx"
            onChange={(e) => setFile(e.target.files[0])}
            className="text-sm text-muted"
          />
          <button type="submit" disabled={uploading || !file} className="btn-primary text-sm">
            {uploading ? "Uploading…" : "Upload resume"}
          </button>
        </form>
        {message && <p className="text-sm text-muted mb-3">{message}</p>}
        <div className="card divide-y divide-line">
          {resumes.map((r) => (
            <div key={r._id} className="p-3 text-sm text-ink">{r.fileName}</div>
          ))}
          {resumes.length === 0 && (
            <div className="p-4 text-sm text-muted">No resume uploaded yet.</div>
          )}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-xl text-ink mb-4">Your match scores</h2>
        <div className="card divide-y divide-line">
          {matches.map((m) => (
            <div key={m._id} className="p-4 flex justify-between items-center text-sm">
              <div>
                <p className="text-ink font-medium">{m.job?.title}</p>
                <p className="text-muted">{m.job?.location}</p>
              </div>
              <span className="font-serif text-2xl text-emerald">
                {(m.finalScore * 100).toFixed(0)}%
              </span>
            </div>
          ))}
          {matches.length === 0 && (
            <div className="p-4 text-sm text-muted">
              No matches yet — browse jobs and check your score against one.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
