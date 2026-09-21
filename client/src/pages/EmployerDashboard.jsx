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

  useEffect(() => {
    api.get("/jobs/mine").then((res) => setJobs(res.data)).catch(console.error);
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-6 pt-12 pb-20">
      <p className="text-xs text-muted mb-1">{today}</p>
      <div className="flex justify-between items-baseline mb-8">
        <h1 className="font-serif text-3xl text-ink">Welcome, {user?.name?.split(" ")[0]}</h1>
        <Link to="/jobs/new" className="btn-primary text-sm">Post a job</Link>
      </div>

      <div className="card divide-y divide-line">
        {jobs.map((job) => (
          <div key={job._id} className="p-4 flex justify-between items-center">
            <div>
              <p className="font-medium text-ink">{job.title}</p>
              <p className="text-sm text-muted">{job.location}</p>
            </div>
            <Link to={`/jobs/${job._id}/candidates`} className="text-emerald text-sm">
              View candidates
            </Link>
          </div>
        ))}
        {jobs.length === 0 && (
          <div className="p-4 text-sm text-muted">No jobs posted yet.</div>
        )}
      </div>
    </div>
  );
}
