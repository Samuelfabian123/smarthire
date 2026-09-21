import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function PostJob() {
  const [form, setForm] = useState({ title: "", description: "", location: "", skillsRequired: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/jobs", {
        ...form,
        skillsRequired: form.skillsRequired.split(",").map((s) => s.trim()).filter(Boolean),
      });
      navigate("/dashboard/employer");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to post job");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 pt-12 pb-20">
      <h1 className="font-serif text-3xl text-ink mb-2">Post a job</h1>
      <p className="text-muted text-sm mb-8">
        The description below is what candidates' resumes get matched against.
      </p>

      {error && (
        <p className="text-sm text-ochre mb-4 border border-ochre/40 bg-ochre/5 px-3 py-2 rounded">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-muted block mb-1">Job title</label>
          <input
            className="input-field"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Description</label>
          <textarea
            className="input-field h-40"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Location</label>
          <input
            className="input-field"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Skills required (comma separated)</label>
          <input
            className="input-field"
            value={form.skillsRequired}
            onChange={(e) => setForm({ ...form, skillsRequired: e.target.value })}
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Posting…" : "Post job"}
        </button>
      </form>
    </div>
  );
}
