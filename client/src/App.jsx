import { lazy, Suspense } from "react";
import { Routes, Route, Link } from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

// Keep the landing page in the initial bundle; load other pages only when needed.
import Home from "./pages/Home";
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const JobSeekerDashboard = lazy(() => import("./pages/JobSeekerDashboard"));
const JobSeekerProfile = lazy(() => import("./pages/JobSeekerProfile.jsx"));
const CareerAgent = lazy(() => import("./pages/CareerAgent"));
const EmployerDashboard = lazy(() => import("./pages/EmployerDashboard"));
const EmployerProfile = lazy(() => import("./pages/EmployerProfile.jsx"));
const PostJob = lazy(() => import("./pages/PostJob"));
const BrowseJobs = lazy(() => import("./pages/BrowseJobs"));
const CandidatesList = lazy(() => import("./pages/CandidatesList"));
const CandidateDetails = lazy(() => import("./pages/CandidateDetails"));

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

      <Suspense
        fallback={
          <main className="flex min-h-[60vh] items-center justify-center px-4">
            <div className="w-full max-w-sm rounded-2xl border border-[#DCD8CC] bg-white p-6 text-center shadow-sm">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#DCD8CC] border-t-[#2F6F4E]" />
              <p className="mt-4 text-sm font-medium text-[#526057]" role="status">
                Loading SmartHire…
              </p>
            </div>
          </main>
        }
      >
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

        {/* SmartHire AI Career Agent */}
        <Route
          path="/dashboard/jobseeker/agent"
          element={
            <ProtectedRoute role="jobseeker">
              <CareerAgent />
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
      </Suspense>
    </div>
  );
}