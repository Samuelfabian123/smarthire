
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, CheckCircle2, Mail, ArrowLeft } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [role, setRole] = useState("jobseeker");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("register");
  const [verificationCode, setVerificationCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    surname: "",
    email: "",
    password: "",
    phone: "",
    companyName: "",
    companyAddress: "",
    professionalTitle: "",
    location: "",
    about: "",
    skills: "",
    education: "",
    experience: "",
    portfolio: "",
  });

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const normalizedEmail = form.email.trim().toLowerCase();

    if (role === "jobseeker" && (!form.firstName.trim() || !form.surname.trim())) {
      setError("Please enter your first name and surname.");
      return;
    }

    if (role === "employer" && !form.companyName.trim()) {
      setError("Please enter your company name.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email: normalizedEmail,
        password: form.password,
        phone: form.phone.trim(),
        role,
        ...(role === "jobseeker"
          ? {
              firstName: form.firstName.trim(),
              surname: form.surname.trim(),
              name: `${form.firstName.trim()} ${form.surname.trim()}`,
            }
          : {
              companyName: form.companyName.trim(),
              companyAddress: form.companyAddress.trim(),
            }),
      };

      const response = await api.post("/auth/register", payload);

      setEmail(response.data.email || normalizedEmail);
      setStage("verify");
      setMessage(
        response.data.message ||
          "Check your email for your six-digit verification code."
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Registration failed. Please try again."
      );

      if (err.response?.data?.accountCreated) {
        setEmail(err.response.data.email || normalizedEmail);
        setStage("verify");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!/^\d{6}$/.test(verificationCode)) {
      setError("Enter the six-digit code sent to your email.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/verify-email", {
        email,
        code: verificationCode,
      });

      if (!response.data.token || !response.data.user) {
        setMessage(
          response.data.message || "Email verified. Please log in."
        );
        navigate("/login", { replace: true });
        return;
      }

      login(response.data.user, response.data.token);

      const verifiedRole = response.data.user.role;

      navigate(
        verifiedRole === "employer"
          ? "/dashboard/employer"
          : "/dashboard/jobseeker",
        { replace: true }
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Verification failed. Check the code and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response = await api.post("/auth/resend-verification", {
        email,
      });

      setMessage(
        response.data.message || "Request processed. Check your email."
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Could not resend the code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-[#DCD8CC] bg-white px-4 py-3 text-sm text-[#16241E] outline-none transition focus:border-[#2F6F4E] focus:ring-2 focus:ring-[#2F6F4E]/10 placeholder:text-[#9A9F9B]";

  return (
    <div className="min-h-screen bg-[#F7F5EE] text-[#16241E]">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* LEFT BRAND PANEL */}
        <section className="relative hidden overflow-hidden bg-[#173D2B] p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1400&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#173D2B]/95 via-[#173D2B]/80 to-[#173D2B]/60" />

          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-xl font-bold">
                S
              </div>
              <span className="text-xl font-semibold tracking-tight">
                SmartHire
              </span>
            </Link>
          </div>

          <div className="relative z-10 max-w-xl py-16">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-[#B9D8C4]">
              Built for the Nigerian job market
            </p>
            <h1 className="font-serif text-5xl leading-tight xl:text-6xl">
              Smarter Matching.
              <br />
              Brighter Futures.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-white/75">
              Connect your skills with opportunities that fit your potential.
              Build your profile and take the next step in your career.
            </p>

            <div className="mt-10 space-y-4">
              {[
                "AI-assisted job matching",
                "Professional jobseeker profiles",
                "Opportunities across Nigeria",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 size={18} className="text-[#B9D8C4]" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 text-xs text-white/50">
            SmartHire · Smarter opportunities for everyone.
          </p>
        </section>

        {/* RIGHT FORM PANEL */}
        <main className="flex items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-xl">
            <div className="mb-8 lg:hidden">
              <Link to="/" className="inline-flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2F6F4E] font-bold text-white">
                  S
                </span>
                <span className="text-lg font-semibold">SmartHire</span>
              </Link>
              <p className="mt-4 text-xs font-medium uppercase tracking-[0.15em] text-[#2F6F4E]">
                Smarter Matching. Brighter Futures.
              </p>
            </div>

            {stage === "register" ? (
              <>
                <div className="mb-7">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#2F6F4E]">
                    Get started
                  </p>
                  <h2 className="font-serif text-3xl sm:text-4xl">
                    Create your account
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#737B76]">
                    Join SmartHire and discover your next opportunity.
                  </p>
                </div>

                <div className="mb-6 grid grid-cols-2 rounded-xl border border-[#DCD8CC] bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setRole("jobseeker")}
                    className={`rounded-lg px-3 py-3 text-sm font-medium transition ${
                      role === "jobseeker"
                        ? "bg-[#2F6F4E] text-white shadow-sm"
                        : "text-[#737B76] hover:bg-[#F7F5EE]"
                    }`}
                  >
                    I'm a Jobseeker
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("employer")}
                    className={`rounded-lg px-3 py-3 text-sm font-medium transition ${
                      role === "employer"
                        ? "bg-[#2F6F4E] text-white shadow-sm"
                        : "text-[#737B76] hover:bg-[#F7F5EE]"
                    }`}
                  >
                    I'm an Employer
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {role === "jobseeker" ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="text-sm font-medium">First Name</label>
                        <input
                          name="firstName"
                          value={form.firstName}
                          onChange={handleChange}
                          autoComplete="given-name"
                          required
                          placeholder="e.g. Samuel"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">Surname</label>
                        <input
                          name="surname"
                          value={form.surname}
                          onChange={handleChange}
                          autoComplete="family-name"
                          required
                          placeholder="e.g. Anyim"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="text-sm font-medium">Company Name</label>
                        <input
                          name="companyName"
                          value={form.companyName}
                          onChange={handleChange}
                          required
                          placeholder="Your registered or business name"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium">
                          Company Address <span className="text-[#9A9F9B]">(optional)</span>
                        </label>
                        <input
                          name="companyAddress"
                          value={form.companyAddress}
                          onChange={handleChange}
                          autoComplete="street-address"
                          placeholder="City or business address"
                          className={inputClass}
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="text-sm font-medium">
                      {role === "employer" ? "Company Email" : "Email Address"}
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      autoComplete="email"
                      required
                      placeholder="you@example.com"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      autoComplete="tel"
                      required
                      placeholder="e.g. 08012345678"
                      className={inputClass}
                    />
                  </div>

                  {role === "jobseeker" && (
                    <div className="rounded-xl border border-[#DCD8CC] bg-white p-4 sm:p-5">
                      <h3 className="mb-4 font-serif text-lg">
                        Professional Information
                      </h3>
                      <p className="mb-4 text-xs leading-5 text-[#737B76]">
                        These details help personalise your profile. You can
                        complete or update them later.
                      </p>

                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">
                            Professional Title
                          </label>
                          <input
                            name="professionalTitle"
                            value={form.professionalTitle}
                            onChange={handleChange}
                            placeholder="e.g. Software Developer"
                            className={inputClass}
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium">Location</label>
                          <input
                            name="location"
                            value={form.location}
                            onChange={handleChange}
                            placeholder="e.g. Enugu, Nigeria"
                            className={inputClass}
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium">Skills</label>
                          <textarea
                            name="skills"
                            value={form.skills}
                            onChange={handleChange}
                            rows={2}
                            placeholder="JavaScript, React, Python..."
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        autoComplete="new-password"
                        minLength={6}
                        required
                        placeholder="At least 6 characters"
                        className={`${inputClass} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737B76]"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-lg bg-[#2F6F4E] py-3.5 text-sm font-semibold text-white transition hover:bg-[#234F38] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Please wait..." : "Create Account"}
                  </button>

                  <p className="text-center text-xs leading-5 text-[#737B76]">
                    By creating an account, you agree to use SmartHire responsibly.
                  </p>
                </form>

                <p className="mt-6 text-center text-sm text-[#737B76]">
                  Already have an account?{" "}
                  <Link to="/login" className="font-semibold text-[#2F6F4E] hover:underline">
                    Sign in
                  </Link>
                </p>
              </>
            ) : (
              <div className="rounded-2xl border border-[#DCD8CC] bg-white p-5 shadow-sm sm:p-8">
                <button
                  type="button"
                  onClick={() => {
                    setStage("register");
                    setError("");
                    setMessage("");
                  }}
                  className="mb-6 inline-flex items-center gap-2 text-sm text-[#737B76] hover:text-[#2F6F4E]"
                >
                  <ArrowLeft size={16} /> Back to registration
                </button>

                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E7F0EA] text-[#2F6F4E]">
                  <Mail size={26} />
                </div>

                <h2 className="font-serif text-3xl">Verify your email</h2>
                <p className="mt-3 text-sm leading-6 text-[#737B76]">
                  Enter the six-digit code sent to{" "}
                  <strong className="break-all text-[#16241E]">{email}</strong>.
                  The code expires after 10 minutes.
                </p>

                {message && (
                  <div className="mt-5 rounded-lg border border-[#C8DDCE] bg-[#E7F0EA] px-4 py-3 text-sm text-[#234F38]">
                    {message}
                  </div>
                )}

                <form onSubmit={handleVerify} className="mt-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium">
                      Six-digit verification code
                    </label>
                    <input
                      value={verificationCode}
                      onChange={(event) =>
                        setVerificationCode(
                          event.target.value.replace(/\D/g, "").slice(0, 6)
                        )
                      }
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                      placeholder="000000"
                      className={`${inputClass} text-center text-2xl tracking-[0.35em]`}
                    />
                  </div>

                  {error && (
                    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || verificationCode.length !== 6}
                    className="w-full rounded-lg bg-[#2F6F4E] py-3.5 text-sm font-semibold text-white transition hover:bg-[#234F38] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Verifying..." : "Verify Email"}
                  </button>
                </form>

                <div className="mt-5 text-center">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="text-sm font-semibold text-[#2F6F4E] hover:underline disabled:opacity-60"
                  >
                    Resend verification code
                  </button>
                </div>

                <p className="mt-5 text-center text-xs leading-5 text-[#737B76]">
                  Check your inbox and spam folder. Never share your verification code.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
