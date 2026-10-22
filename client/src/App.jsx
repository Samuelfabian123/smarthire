import { Routes, Route, Link } from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import JobSeekerDashboard from "./pages/JobSeekerDashboard";
import JobSeekerProfile from "./pages/JobSeekerProfile.jsx";

import EmployerDashboard from "./pages/EmployerDashboard";
import EmployerProfile from "./pages/EmployerProfile.jsx";

import PostJob from "./pages/PostJob";
import BrowseJobs from "./pages/BrowseJobs";
import CandidatesList from "./pages/CandidatesList";
import CandidateDetails from "./pages/CandidateDetails";

function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">
          Error 404
        </p>

        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          Page not found
        </h1>

        <p className="mt-3 text-slate-600">
          The page you are looking for may have moved or the address may be incorrect.
        </p>

        <Link
          to="/"
          className="inline-flex mt-6 items-center justify-center rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700"
        >
          Return to SmartHire Home
        </Link>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <Routes>
        {/* Public pages */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Jobseeker pages */}
        <Route
          path="/dashboard/jobseeker"
          element={
            <ProtectedRoute role="jobseeker">
              <JobSeekerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/jobseeker/profile"
          element={
            <ProtectedRoute role="jobseeker">
              <JobSeekerProfile />
            </ProtectedRoute>
          }
        />

        {/* Employer pages */}
        <Route
          path="/dashboard/employer"
          element={
            <ProtectedRoute role="employer">
              <EmployerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/employer/profile"
          element={
            <ProtectedRoute role="employer">
              <EmployerProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/jobs/new"
          element={
            <ProtectedRoute role="employer">
              <PostJob />
            </ProtectedRoute>
          }
        />

        {/* Job browsing */}
        <Route path="/jobs" element={<BrowseJobs />} />

        {/* Employer applicants */}
        <Route
          path="/matches/job/:jobId/candidates"
          element={
            <ProtectedRoute role="employer">
              <CandidatesList />
            </ProtectedRoute>
          }
        />

        {/* Individual candidate details */}
        <Route
          path="/matches/job/:jobId/candidates/:candidateId"
          element={
            <ProtectedRoute role="employer">
              <CandidateDetails />
            </ProtectedRoute>
          }
        />

        {/* Fallback for unknown URLs */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}