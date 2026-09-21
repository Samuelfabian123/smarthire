import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="border-b border-line bg-paper px-6 md:px-10 py-4 flex justify-between items-center">
      <Link to="/" className="font-serif text-xl text-ink">
        SmartHire
      </Link>
      <div className="flex gap-6 items-center text-sm text-ink">
        {!user && (
          <>
            <Link to="/login" className="hover:text-emerald">Log in</Link>
            <Link to="/register" className="btn-primary text-sm">Get started</Link>
          </>
        )}
        {user?.role === "jobseeker" && (
          <>
            <Link to="/dashboard/jobseeker" className="hover:text-emerald">Dashboard</Link>
            <Link to="/jobs" className="hover:text-emerald">Browse jobs</Link>
          </>
        )}
        {user?.role === "employer" && (
          <>
            <Link to="/dashboard/employer" className="hover:text-emerald">Dashboard</Link>
            <Link to="/jobs/new" className="hover:text-emerald">Post a job</Link>
          </>
        )}
        {user && (
          <button onClick={handleLogout} className="btn-secondary text-sm py-1.5 px-3">
            Log out
          </button>
        )}
      </div>
    </nav>
  );
}
