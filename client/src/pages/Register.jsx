
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [role, setRole] = useState("jobseeker");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

      const { token, user } = response.data || {};

      if (!token || !user) {
        throw new Error("Registration response was incomplete. Please try again.");
      }

      login(user, token);

      navigate(
        user.role === "employer"
          ? "/dashboard/employer"
          : "/dashboard/jobseeker",
        { replace: true }
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          "Registration failed. Please try again."
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
          </div>
        </main>
      </div>
    </div>
  );
}
