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

    // Job seeker details
    phone: "",
    professionalTitle: "",
    location: "",
    about: "",
    skills: "",
    education: "",
    experience: "",
    portfolio: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      /*
       * Step 1:
       * Create the main SmartHire account.
       */
      const accountData = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        companyName: form.companyName,
      };

      const { data } = await api.post(
        "/auth/register",
        accountData
      );

      /*
       * Log the user in immediately after registration.
       * This gives us the JWT needed to save the profile.
       */
      login(data.user, data.token);

      /*
       * Step 2:
       * If this is a job seeker, save their professional
       * information into their JobSeekerProfile.
       */
      if (form.role === "jobseeker") {
        try {
          await api.put("/profile/jobseeker", {
            fullName: form.name,
            professionalTitle: form.professionalTitle,
            phone: form.phone,
            location: form.location,
            about: form.about,
            skills: form.skills,
            education: form.education,
            experience: form.experience,
            portfolio: form.portfolio,
          });
        } catch (profileError) {
          console.error(
            "Profile creation error:",
            profileError
          );
        }
      }

      /*
       * Step 3:
       * Send the user to the correct dashboard.
       */
      navigate(
        data.user.role === "employer"
          ? "/dashboard/employer"
          : "/dashboard/jobseeker"
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-slate-50">
      <div className="grid min-h-[calc(100vh-72px)] lg:grid-cols-2">

        {/* =====================================================
            LEFT SIDE
        ====================================================== */}
        <div className="relative hidden overflow-hidden bg-emerald-950 lg:flex">

          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=85')",
            }}
          />

          <div className="absolute inset-0 bg-emerald-950/90" />

          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />

          <div className="absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-green-400/10 blur-3xl" />

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">

            {/* Logo */}
            <div>
              <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-2xl font-bold text-white shadow-lg">
                  S
                </div>

                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">
                    SmartHire
                  </h2>

                  <p className="text-xs text-emerald-200">
                    Smarter Matching. Brighter Futures.
                  </p>
                </div>

              </div>
            </div>

            {/* Main message */}
            <div className="max-w-xl">

              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200 backdrop-blur-sm">

                <span className="h-2 w-2 rounded-full bg-emerald-400" />

                Join the SmartHire community

              </div>

              <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">

                Your next opportunity

                <span className="block text-emerald-400">
                  starts here.
                </span>

              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 text-slate-200">
                Create your SmartHire account and connect with
                opportunities and talent using intelligent
                AI-powered matching.
              </p>

              {/* Features */}
              <div className="mt-8 space-y-4">

                <div className="flex items-center gap-4">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                    ✓
                  </div>

                  <div>
                    <p className="font-semibold text-white">
                      For job seekers
                    </p>

                    <p className="text-sm text-slate-300">
                      Discover jobs that match your skills.
                    </p>
                  </div>

                </div>

                <div className="flex items-center gap-4">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                    ✓
                  </div>

                  <div>
                    <p className="font-semibold text-white">
                      For employers
                    </p>

                    <p className="text-sm text-slate-300">
                      Find candidates who fit your requirements.
                    </p>
                  </div>

                </div>

                <div className="flex items-center gap-4">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                    ✓
                  </div>

                  <div>
                    <p className="font-semibold text-white">
                      AI-powered matching
                    </p>

                    <p className="text-sm text-slate-300">
                      Match people with opportunities more intelligently.
                    </p>
                  </div>

                </div>

              </div>

            </div>

            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} SmartHire. All rights reserved.
            </p>

          </div>

        </div>

        {/* =====================================================
            RIGHT SIDE
        ====================================================== */}
        <div className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">

          <div className="w-full max-w-md">

            {/* Mobile logo */}
            <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-xl font-bold text-white">
                S
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  SmartHire
                </h2>

                <p className="text-xs text-slate-500">
                  Smarter Matching. Brighter Futures.
                </p>
              </div>

            </div>

            {/* Registration card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/60 sm:p-9">

              <div className="mb-7">

                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  Create your account
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Build your SmartHire profile and connect with
                  the right opportunities.
                </p>

              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* =================================================
                    BASIC ACCOUNT INFORMATION
                ================================================== */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Full name
                  </label>

                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email address
                  </label>

                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Phone number
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    placeholder="e.g. 08012345678"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    value={form.phone}
                    onChange={handleChange}
                    required={form.role === "jobseeker"}
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Password
                  </label>

                  <div className="relative">

                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Create a password"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-16 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                      value={form.password}
                      onChange={handleChange}
                      required
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(!showPassword)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 transition hover:text-emerald-600"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>

                  </div>
                </div>

                {/* =================================================
                    ACCOUNT TYPE
                ================================================== */}

                <div>

                  <label className="mb-3 block text-sm font-semibold text-slate-700">
                    I am joining as
                  </label>

                  <div className="grid grid-cols-2 gap-3">

                    {/* Job seeker */}
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          role: "jobseeker",
                          companyName: "",
                        })
                      }
                      className={`rounded-xl border p-4 text-left transition ${
                        form.role === "jobseeker"
                          ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/10"
                          : "border-slate-200 bg-slate-50 hover:border-emerald-300"
                      }`}
                    >

                      <div className="mb-2 text-xl">
                        👤
                      </div>

                      <p className="text-sm font-bold text-slate-900">
                        Job seeker
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Find opportunities
                      </p>

                    </button>

                    {/* Employer */}
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          role: "employer",
                        })
                      }
                      className={`rounded-xl border p-4 text-left transition ${
                        form.role === "employer"
                          ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/10"
                          : "border-slate-200 bg-slate-50 hover:border-emerald-300"
                      }`}
                    >

                      <div className="mb-2 text-xl">
                        🏢
                      </div>

                      <p className="text-sm font-bold text-slate-900">
                        Employer
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Hire great talent
                      </p>

                    </button>

                  </div>

                </div>

                {/* =================================================
                    JOB SEEKER INFORMATION
                ================================================== */}

                {form.role === "jobseeker" && (
                  <div className="space-y-5 border-t border-slate-100 pt-5">

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                        Professional information
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Tell employers about your skills and experience.
                      </p>
                    </div>

                    {/* Professional title */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Professional title
                      </label>

                      <input
                        type="text"
                        name="professionalTitle"
                        placeholder="e.g. Frontend Developer"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                        value={form.professionalTitle}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* Location */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Location
                      </label>

                      <input
                        type="text"
                        name="location"
                        placeholder="e.g. Enugu, Nigeria"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                        value={form.location}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* About */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        About you
                      </label>

                      <textarea
                        name="about"
                        rows="4"
                        placeholder="Briefly tell employers about yourself, your career goals and what you can offer."
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                        value={form.about}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* Skills */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Skills
                      </label>

                      <textarea
                        name="skills"
                        rows="3"
                        placeholder="e.g. JavaScript, React, Node.js, MongoDB, Python"
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                        value={form.skills}
                        onChange={handleChange}
                        required
                      />

                      <p className="mt-1 text-xs text-slate-400">
                        Separate multiple skills with commas.
                      </p>
                    </div>

                    {/* Education */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Education
                      </label>

                      <textarea
                        name="education"
                        rows="3"
                        placeholder="e.g. B.Sc. Computer Science, University of Nigeria, Nsukka"
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                        value={form.education}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* Experience */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Work experience
                      </label>

                      <textarea
                        name="experience"
                        rows="4"
                        placeholder="Describe your previous work experience, internships, SIWES, NYSC or relevant projects."
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                        value={form.experience}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* Portfolio */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Portfolio / LinkedIn
                      </label>

                      <input
                        type="url"
                        name="portfolio"
                        placeholder="https://..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                        value={form.portfolio}
                        onChange={handleChange}
                      />
                    </div>

                  </div>
                )}

                {/* =================================================
                    EMPLOYER INFORMATION
                ================================================== */}

                {form.role === "employer" && (
                  <div className="border-t border-slate-100 pt-5">

                    <p className="mb-4 text-xs font-bold uppercase tracking-wider text-emerald-600">
                      Company information
                    </p>

                    <div>

                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Company name
                      </label>

                      <input
                        type="text"
                        name="companyName"
                        placeholder="Enter your company name"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                        value={form.companyName}
                        onChange={handleChange}
                        required
                      />

                    </div>

                  </div>
                )}

                {/* Register button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {loading
                    ? "Creating account..."
                    : "Create account"}

                  {!loading && (
                    <span className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  )}

                </button>

              </form>

              {/* Security note */}
              <div className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-center text-xs leading-5 text-emerald-700">
                Your information is securely protected.
              </div>

              {/* Login */}
              <p className="mt-7 text-center text-sm text-slate-500">

                Already have an account?{" "}

                <Link
                  to="/login"
                  className="font-bold text-emerald-600 transition hover:text-emerald-700"
                >
                  Log in
                </Link>

              </p>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}