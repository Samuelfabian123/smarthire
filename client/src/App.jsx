import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import JobSeekerDashboard from "./pages/JobSeekerDashboard";
import EmployerDashboard from "./pages/EmployerDashboard";
import PostJob from "./pages/PostJob";
import BrowseJobs from "./pages/BrowseJobs";
import CandidatesList from "./pages/CandidatesList";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password/:token"
          element={<ResetPassword />}
        />

        <Route
          path="/dashboard/jobseeker"
          element={
            <ProtectedRoute role="jobseeker">
              <JobSeekerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/employer"
          element={
            <ProtectedRoute role="employer">
              <EmployerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/jobs"
          element={
            <ProtectedRoute role="jobseeker">
              <BrowseJobs />
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

        <Route
          path="/jobs/:jobId/candidates"
          element={
            <ProtectedRoute role="employer">
              <CandidatesList />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}