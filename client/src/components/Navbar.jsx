import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  function closeMobile() {
    setMobileOpen(false);
  }

  function handleLogout() {
    logout();
    closeMobile();
    navigate("/login");
  }

  return (
    <nav className="relative z-40 border-b border-line bg-paper px-4 py-3 sm:px-6 md:px-10">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <Link to="/" onClick={closeMobile} className="flex min-w-0 items-center gap-2 font-serif text-xl text-ink">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white">
            <Zap size={19} />
          </span>
          <span>SmartHire</span>
        </Link>

        <div className="hidden items-center gap-5 text-sm text-ink md:flex">
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
            <button type="button" onClick={handleLogout} className="btn-secondary px-3 py-1.5 text-sm">
              Log out
            </button>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 md:hidden"
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
          aria-controls="smarthire-mobile-menu"
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      {mobileOpen && (
        <div id="smarthire-mobile-menu" className="absolute left-0 right-0 top-full z-50 border-t border-slate-100 bg-white px-4 pb-5 pt-3 shadow-lg md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {!user && (
              <>
                <Link to="/login" onClick={closeMobile} className="rounded-xl px-4 py-3 font-medium text-slate-700 hover:bg-slate-50">Log in</Link>
                <Link to="/register" onClick={closeMobile} className="rounded-xl bg-emerald-700 px-4 py-3 text-center font-semibold text-white">Get started</Link>
              </>
            )}
            {user?.role === "jobseeker" && (
              <>
                <Link to="/dashboard/jobseeker" onClick={closeMobile} className="rounded-xl px-4 py-3 font-medium text-slate-700 hover:bg-slate-50">Dashboard</Link>
                <Link to="/jobs" onClick={closeMobile} className="rounded-xl px-4 py-3 font-medium text-slate-700 hover:bg-slate-50">Browse jobs</Link>
              </>
            )}
            {user?.role === "employer" && (
              <>
                <Link to="/dashboard/employer" onClick={closeMobile} className="rounded-xl px-4 py-3 font-medium text-slate-700 hover:bg-slate-50">Dashboard</Link>
                <Link to="/jobs/new" onClick={closeMobile} className="rounded-xl px-4 py-3 font-medium text-slate-700 hover:bg-slate-50">Post a job</Link>
              </>
            )}
            {user && (
              <button type="button" onClick={handleLogout} className="rounded-xl border border-slate-200 px-4 py-3 text-left font-medium text-slate-700">Log out</button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
