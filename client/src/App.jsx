import { Routes, Route } from "react-router-dom";
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

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

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

        <Route path="/jobs" element={<BrowseJobs />} />

        <Route
          path="/matches/job/:jobId/candidates"
          element={
            <ProtectedRoute role="employer">
              <CandidatesList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/candidates/:candidateId"
          element={
            <ProtectedRoute role="employer">
              <CandidateDetails />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}