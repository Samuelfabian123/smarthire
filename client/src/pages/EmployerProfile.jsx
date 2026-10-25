import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const API_ORIGIN = new URL(API_BASE_URL, window.location.origin).origin;

function getImageUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
}

export default function EmployerProfile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    location: "",
    industry: "",
    description: "",
    website: "",
  });

  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/profile/employer");

      if (res.data) {
        setProfile({
          companyName: res.data.companyName || "",
          contactName: res.data.contactName || "",
          email: res.data.email || "",
          phone: res.data.phone || "",
          location: res.data.location || "",
          industry: res.data.industry || "",
          description: res.data.description || "",
          website: res.data.website || "",
        });

        if (res.data.logoUrl) {
          setPreview(res.data.logoUrl);
          setLogoFailed(false);
        }
      }
    } catch (err) {
      console.error("Unable to load employer profile:", err);
      setError(err.response?.data?.error || "Could not load your company profile. You can retry or continue editing.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  }

  function handleLogoChange(e) {
    const selectedFile = e.target.files[0];

    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      e.target.value = "";
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("Your company logo must be smaller than 5MB.");
      e.target.value = "";
      return;
    }
    setLogo(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setLogoFailed(false);
    setError("");
    setMessage("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();

      Object.keys(profile).forEach((key) => {
        formData.append(key, profile[key]);
      });

      if (logo) {
        formData.append("logo", logo);
      }

      const response = await api.put("/profile/employer", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage(response.data?.message || "Company profile saved successfully.");

      // Return to employer dashboard after a successful save
      navigate("/dashboard/employer");

    } catch (err) {
      console.error("Save employer profile error:", err);

      setError(
        err.response?.data?.error ||
          "Unable to save company profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5EE] px-4 py-8 sm:py-10">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.16em] text-[#2F6F4E] mb-2">
            SmartHire
          </p>

          <h1 className="font-serif text-3xl sm:text-4xl text-[#16241E]">
            Company Profile
          </h1>

          <p className="text-sm text-[#737B76] mt-2 max-w-2xl">
            Create a professional company profile so job seekers can
            learn more about your organisation.
          </p>
        </div>

        {loading && <div className="mb-5 rounded-xl border border-[#DCD8CC] bg-white p-4 text-sm text-[#526057]" role="status">Loading company profile…</div>}
        {error && <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="alert"><span>{error}</span><button type="button" onClick={loadProfile} disabled={loading} className="rounded-lg border border-amber-300 bg-white px-3 py-2 font-semibold disabled:opacity-50">{loading ? "Retrying…" : "Retry"}</button></div>}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* COMPANY LOGO */}
          <section className="bg-white border border-[#DCD8CC] rounded-2xl p-5 sm:p-6">

            <h2 className="font-serif text-xl text-[#16241E] mb-5">
              Company Logo
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-5">

              <div className="w-28 h-28 rounded-2xl overflow-hidden bg-[#E7F0EA] border border-[#DCD8CC] flex items-center justify-center">

                {preview && !logoFailed ? (
                  <img
                    src={getImageUrl(preview)}
                    alt="Company Logo"
                    className="w-full h-full object-cover"
                    onError={() => setLogoFailed(true)}
                  />
                ) : (
                  <span className="text-4xl">
                    🏢
                  </span>
                )}

              </div>

              <div className="text-center sm:text-left">

                <label className="inline-flex items-center justify-center bg-[#2F6F4E] text-white px-5 py-3 rounded-lg text-sm font-medium cursor-pointer hover:bg-[#234F38] transition-colors">
                  {preview
                    ? "Change Company Logo"
                    : "Choose Company Logo"}

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>

                <p className="text-xs text-[#7A827D] mt-2">
                  JPG, PNG or WEBP. Maximum size: 5MB.
                </p>

              </div>

            </div>

          </section>


          {/* COMPANY INFORMATION */}
          <section className="bg-white border border-[#DCD8CC] rounded-2xl p-5 sm:p-6">

            <h2 className="font-serif text-xl text-[#16241E] mb-5">
              Company Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div>
                <label className="text-sm text-[#16241E]">
                  Company Name
                </label>

                <input
                  name="companyName"
                  value={profile.companyName}
                  onChange={handleChange}
                  placeholder="e.g. SmartTech Solutions Ltd"
                  className="input mt-1 w-full"
                />
              </div>

              <div>
                <label className="text-sm text-[#16241E]">
                  Industry
                </label>

                <input
                  name="industry"
                  value={profile.industry}
                  onChange={handleChange}
                  placeholder="e.g. Technology"
                  className="input mt-1 w-full"
                />
              </div>

              <div>
                <label className="text-sm text-[#16241E]">
                  Contact Person
                </label>

                <input
                  name="contactName"
                  value={profile.contactName}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  className="input mt-1 w-full"
                />
              </div>

              <div>
                <label className="text-sm text-[#16241E]">
                  Company Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  placeholder="company@example.com"
                  className="input mt-1 w-full"
                />
              </div>

              <div>
                <label className="text-sm text-[#16241E]">
                  Phone Number
                </label>

                <input
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  placeholder="e.g. 08012345678"
                  className="input mt-1 w-full"
                />
              </div>

              <div>
                <label className="text-sm text-[#16241E]">
                  Company Location
                </label>

                <input
                  name="location"
                  value={profile.location}
                  onChange={handleChange}
                  placeholder="e.g. Enugu, Nigeria"
                  className="input mt-1 w-full"
                />
              </div>

            </div>

          </section>


          {/* ABOUT COMPANY */}
          <section className="bg-white border border-[#DCD8CC] rounded-2xl p-5 sm:p-6">

            <h2 className="font-serif text-xl text-[#16241E] mb-5">
              About the Company
            </h2>

            <textarea
              name="description"
              value={profile.description}
              onChange={handleChange}
              rows="6"
              placeholder="Tell job seekers about your company, what you do and the type of people you are looking to hire."
              className="input w-full"
            />

          </section>


          {/* WEBSITE */}
          <section className="bg-white border border-[#DCD8CC] rounded-2xl p-5 sm:p-6">

            <h2 className="font-serif text-xl text-[#16241E] mb-5">
              Company Website
            </h2>

            <input
              type="url"
              name="website"
              value={profile.website}
              onChange={handleChange}
              placeholder="https://www.example.com"
              className="input w-full"
            />

          </section>


          {/* MESSAGE */}
          {message && (
            <div role="status" className="bg-white border border-[#DCD8CC] rounded-xl p-4 text-sm text-[#47725A]">
              {message}
            </div>
          )}


          {/* SAVE */}
          <button
            type="submit"
            disabled={saving || loading}
            className="w-full bg-[#2F6F4E] text-white py-3.5 rounded-lg text-sm font-medium hover:bg-[#234F38] transition-colors disabled:opacity-60"
          >
            {saving
              ? "Saving Company Profile..."
              : "Save Company Profile"}
          </button>

        </form>

      </div>
    </div>
  );
}