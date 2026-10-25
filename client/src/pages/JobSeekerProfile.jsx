import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Save, ArrowLeft, LoaderCircle } from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API_ORIGIN = new URL(API_BASE_URL, window.location.origin).origin;

function getImageUrl(url) {
  if (!url) return "";

  // Keep complete image URLs unchanged.
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  // Resolve relative upload paths against the backend server.
  return `${API_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
}

const initialProfile = {
  firstName: "",
  surname: "",
  fullName: "",
  professionalTitle: "",
  phone: "",
  location: "",
  about: "",
  skills: "",
  education: "",
  experience: "",
  portfolio: "",
};

export default function JobSeekerProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState(initialProfile);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/profile/jobseeker");
      const data = response.data || {};

      const firstName = data.firstName || user?.firstName || "";
      const surname = data.surname || user?.surname || "";

      setProfile({
        firstName,
        surname,
        fullName:
          data.fullName ||
          [firstName, surname].filter(Boolean).join(" ") ||
          user?.name ||
          "",
        professionalTitle: data.professionalTitle || "",
        phone: data.phone || user?.phone || "",
        location: data.location || "",
        about: data.about || "",
        skills: Array.isArray(data.skills)
          ? data.skills.join(", ")
          : data.skills || "",
        education: data.education || "",
        experience: data.experience || "",
        portfolio: data.portfolio || "",
      });

      const savedPhoto = data.photoUrl || "";

      setPhotoPreview(savedPhoto);
      setImageFailed(false);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Could not load your profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => {
      const updated = { ...previous, [name]: value };

      if (name === "firstName" || name === "surname") {
        updated.fullName = [
          name === "firstName" ? value : previous.firstName,
          name === "surname" ? value : previous.surname,
        ]
          .filter(Boolean)
          .join(" ");
      }

      return updated;
    });

    setMessage("");
    setError("");
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Your profile photo must be smaller than 5MB.");
      event.target.value = "";
      return;
    }

    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setImageFailed(false);
    setMessage("");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!profile.firstName.trim() || !profile.surname.trim()) {
      setError("Please enter both your first name and surname.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const formData = new FormData();

      const fullName = [
        profile.firstName.trim(),
        profile.surname.trim(),
      ]
        .filter(Boolean)
        .join(" ");

      formData.append("firstName", profile.firstName.trim());
      formData.append("surname", profile.surname.trim());
      formData.append("fullName", fullName);
      formData.append("professionalTitle", profile.professionalTitle);
      formData.append("phone", profile.phone);
      formData.append("location", profile.location);
      formData.append("about", profile.about);
      formData.append("skills", profile.skills);
      formData.append("education", profile.education);
      formData.append("experience", profile.experience);
      formData.append("portfolio", profile.portfolio);

      if (photo) {
        formData.append("photo", photo);
      }

      const response = await api.put("/profile/jobseeker", formData);

      // Use the URL returned by the backend after a successful save.
      if (response.data?.photoUrl) {
        setPhotoPreview(response.data.photoUrl);
        setImageFailed(false);
      }

      setPhoto(null);

      setMessage(
        response.data?.message || "Profile saved successfully."
      );

      navigate("/dashboard/jobseeker", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Could not save your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F7F2] text-[#176B4D]">
        <LoaderCircle className="mr-3 animate-spin" size={24} />
        Loading your profile...
      </div>
    );
  }

  const imageUrl = getImageUrl(photoPreview);

  return (
    <div className="min-h-screen bg-[#F8F7F2] px-4 py-8 text-[#16241E] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={() => navigate("/dashboard/jobseeker")}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#176B4D] transition hover:text-[#0E4934]"
        >
          <ArrowLeft size={18} />
          Back to dashboard
        </button>

        <div className="mb-7">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-[#21845E]">
            Your professional identity
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            My Profile
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
            Keep your details up to date so SmartHire can better match
            you with relevant opportunities.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-2xl border border-[#E6E9E2] bg-white p-5 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F4EC] text-[#176B4D]">
                <User size={22} />
              </div>

              <div>
                <h2 className="text-lg font-bold">
                  Personal information
                </h2>

                <p className="text-sm text-gray-500">
                  Tell employers who you are.
                </p>
              </div>
            </div>

            <div className="mb-7 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#DCE9DF] bg-[#E8F4EC] text-2xl font-bold text-[#176B4D]">
                {imageUrl && !imageFailed ? (
                  <img
                    src={imageUrl}
                    alt="Profile photo"
                    className="h-full w-full object-cover"
                    onError={() => setImageFailed(true)}
                  />
                ) : (
                  (
                    profile.firstName?.[0] ||
                    profile.fullName?.[0] ||
                    "U"
                  ).toUpperCase()
                )}
              </div>

              <div>
                <label
                  htmlFor="profilePhoto"
                  className="inline-flex cursor-pointer items-center rounded-lg border border-[#D4E4D8] px-4 py-2 text-sm font-semibold text-[#176B4D] transition hover:bg-[#F2F8F3]"
                >
                  Upload profile photo
                </label>

                <input
                  id="profilePhoto"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />

                <p className="mt-2 text-xs text-gray-500">
                  JPG, PNG, or another image format. Maximum 5MB.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="firstName"
                  className="mb-2 block text-sm font-semibold"
                >
                  First name *
                </label>

                <input
                  id="firstName"
                  name="firstName"
                  value={profile.firstName}
                  onChange={handleChange}
                  placeholder="Enter your first name"
                  autoComplete="given-name"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-[#21845E] focus:ring-2 focus:ring-[#21845E]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="surname"
                  className="mb-2 block text-sm font-semibold"
                >
                  Surname *
                </label>

                <input
                  id="surname"
                  name="surname"
                  value={profile.surname}
                  onChange={handleChange}
                  placeholder="Enter your surname"
                  autoComplete="family-name"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-[#21845E] focus:ring-2 focus:ring-[#21845E]/10"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="professionalTitle"
                  className="mb-2 block text-sm font-semibold"
                >
                  Professional title
                </label>

                <input
                  id="professionalTitle"
                  name="professionalTitle"
                  value={profile.professionalTitle}
                  onChange={handleChange}
                  placeholder="e.g. Python + Full-Stack (JS) Developer"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-[#21845E] focus:ring-2 focus:ring-[#21845E]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-semibold"
                >
                  Phone number
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={handleChange}
                  placeholder="e.g. 08012345678"
                  autoComplete="tel"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-[#21845E] focus:ring-2 focus:ring-[#21845E]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="mb-2 block text-sm font-semibold"
                >
                  Location
                </label>

                <input
                  id="location"
                  name="location"
                  value={profile.location}
                  onChange={handleChange}
                  placeholder="e.g. Nsukka, Enugu State"
                  autoComplete="address-level2"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-[#21845E] focus:ring-2 focus:ring-[#21845E]/10"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="about"
                  className="mb-2 block text-sm font-semibold"
                >
                  About you
                </label>

                <textarea
                  id="about"
                  name="about"
                  value={profile.about}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Write a short professional summary..."
                  className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-[#21845E] focus:ring-2 focus:ring-[#21845E]/10"
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#E6E9E2] bg-white p-5 shadow-sm sm:p-8">
            <h2 className="mb-1 text-lg font-bold">
              Career information
            </h2>

            <p className="mb-6 text-sm text-gray-500">
              These details help employers understand your qualifications.
            </p>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="skills"
                  className="mb-2 block text-sm font-semibold"
                >
                  Skills
                </label>

                <textarea
                  id="skills"
                  name="skills"
                  value={profile.skills}
                  onChange={handleChange}
                  rows={3}
                  placeholder="React, Node.js, Python, MongoDB..."
                  className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-[#21845E] focus:ring-2 focus:ring-[#21845E]/10"
                />

                <p className="mt-2 text-xs text-gray-500">
                  Separate skills with commas.
                </p>
              </div>

              <div>
                <label
                  htmlFor="education"
                  className="mb-2 block text-sm font-semibold"
                >
                  Education
                </label>

                <textarea
                  id="education"
                  name="education"
                  value={profile.education}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Institution, qualification, course, and graduation year..."
                  className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-[#21845E] focus:ring-2 focus:ring-[#21845E]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="experience"
                  className="mb-2 block text-sm font-semibold"
                >
                  Work experience
                </label>

                <textarea
                  id="experience"
                  name="experience"
                  value={profile.experience}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe your roles, projects, responsibilities, and achievements..."
                  className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-[#21845E] focus:ring-2 focus:ring-[#21845E]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="portfolio"
                  className="mb-2 block text-sm font-semibold"
                >
                  Portfolio or LinkedIn URL
                </label>

                <input
                  id="portfolio"
                  name="portfolio"
                  type="url"
                  value={profile.portfolio}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none transition focus:border-[#21845E] focus:ring-2 focus:ring-[#21845E]/10"
                />
              </div>
            </div>
          </section>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {message && (
            <div
              role="status"
              className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
            >
              {message}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/dashboard/jobseeker")}
              className="rounded-xl border border-gray-200 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#176B4D] px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-[#0E4934] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}

              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}