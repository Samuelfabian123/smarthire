import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "jobseeker",
    companyName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", form);
      login(data.user, data.token);
      navigate(data.user.role === "employer" ? "/dashboard/employer" : "/dashboard/jobseeker");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 px-6">
      <h1 className="font-serif text-3xl text-ink mb-2">Create an account</h1>
      <p className="text-muted text-sm mb-8">Join as a job seeker or an employer.</p>

      {error && (
        <p className="text-sm text-ochre mb-4 border border-ochre/40 bg-ochre/5 px-3 py-2 rounded">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-muted block mb-1">Full name</label>
          <input
            className="input-field"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Email</label>
          <input
            type="email"
            className="input-field"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Password</label>
          <input
            type="password"
            className="input-field"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">I am a</label>
          <select
            className="input-field"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="jobseeker">Job seeker</option>
            <option value="employer">Employer</option>
          </select>
        </div>
        {form.role === "employer" && (
          <div>
            <label className="text-xs text-muted block mb-1">Company name</label>
            <input
              className="input-field"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            />
          </div>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Creating account…" : "Register"}
        </button>
      </form>

      <p className="text-sm text-muted mt-6">
        Already have an account?{" "}
        <Link to="/login" className="text-emerald">Log in</Link>
      </p>
    </div>
  );
}
