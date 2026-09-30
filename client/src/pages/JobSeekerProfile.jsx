import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

export default function JobSeekerProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    fullName: "",
    professionalTitle: "",
    phone: "",
    location: "",
    about: "",
    skills: "",
    education: "",
    experience: "",
    portfolio: "",
  });

  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const res = await api.get("/profile/jobseeker");

      if (res.data) {
        setProfile({
          fullName: res.data.fullName || user?.name || "",
          professionalTitle: res.data.professionalTitle || "",
          phone: res.data.phone || "",
          location: res.data.location || "",
          about: res.data.about || "",
          skills: res.data.skills || "",
          education: res.data.education || "",
          experience: res.data.experience || "",
          portfolio: res.data.portfolio || "",
        });

        if (res.data.photoUrl) {
          setPreview(res.data.photoUrl);
        }
      }
    } catch (err) {
      console.log("Profile not found yet.");
    }
  }

  function handleChange(e) {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  }

  function handlePhotoChange(e) {
    const selectedFile = e.target.files[0];

    if (!selectedFile) return;

    setPhoto(selectedFile);

    const imageUrl = URL.createObjectURL(selectedFile);
    setPreview(imageUrl);

    setMessage("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setSaving(true);
    setMessage("");

    try {
      const formData = new FormData();

      Object.keys(profile).forEach((key) => {
        formData.append(key, profile[key]);
      });

      if (photo) {
        formData.append("photo", photo);
      }

      const res = await api.put(
        "/profile/jobseeker",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res.data?.photoUrl) {
        setPreview(res.data.photoUrl);
      }

      setPhoto(null);

      navigate("/dashboard/jobseeker");
    } catch (err) {
      console.error("Save profile error:", err);

      setMessage(
        err.response?.data?.error ||
          "Unable to save profile."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F5EE] px-4 py-8 sm:py-10">
      <div className="max-w-4xl mx-auto">

        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.16em] text-[#2F6F4E] mb-2">
            SmartHire
          </p>

          <h1 className="font-serif text-3xl sm:text-4xl text-[#16241E]">
            My Profile
          </h1>

          <p className="text-sm text-[#737B76] mt-2 max-w-2xl">
            Create a professional profile so employers can learn more
            about your skills, experience and career goals.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* PROFILE PHOTO */}
          <section className="bg-white border border-[#DCD8CC] rounded-2xl p-5 sm:p-6">
            <h2 className="font-serif text-xl text-[#16241E] mb-5">
              Profile Photo
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-[#E7F0EA] border border-[#DCD8CC] flex items-center justify-center">
                {preview ? (
                  <img
                    src={preview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl">👤</span>
                )}
              </div>

              <div className="text-center sm:text-left">
                <label className="inline-flex items-center justify-center bg-[#2F6F4E] text-white px-5 py-3 rounded-lg text-sm font-medium cursor-pointer hover:bg-[#234F38] transition-colors">
                  {preview
                    ? "Change Profile Photo"
                    : "Choose Profile Photo"}

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>

                <p className="text-xs text-[#7A827D] mt-2">
                  JPG, PNG or WEBP. Maximum size: 5MB.
                </p>
              </div>
            </div>
          </section>

          {/* PERSONAL INFORMATION */}
          <section className="bg-white border border-[#DCD8CC] rounded-2xl p-5 sm:p-6">
            <h2 className="font-serif text-xl text-[#16241E] mb-5">
              Personal Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div>
                <label className="text-sm text-[#16241E]">
                  Full Name
                </label>

                <input
                  name="fullName"
                  value={profile.fullName}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className="input mt-1 w-full"
                />
              </div>

              <div>
                <label className="text-sm text-[#16241E]">
                  Professional Title
                </label>

                <input
                  name="professionalTitle"
                  value={profile.professionalTitle}
                  onChange={handleChange}
                  placeholder="e.g. Frontend Developer"
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
                  Location
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

          {/* ABOUT ME */}
          <section className="bg-white border border-[#DCD8CC] rounded-2xl p-5 sm:p-6">
            <h2 className="font-serif text-xl text-[#16241E] mb-5">
              About Me
            </h2>

            <textarea
              name="about"
              value={profile.about}
              onChange={handleChange}
              rows="5"
              placeholder="Tell employers about yourself, your career goals and what you can offer."
              className="input w-full"
            />
          </section>

          {/* SKILLS */}
          <section className="bg-white border border-[#DCD8CC] rounded-2xl p-5 sm:p-6">
            <h2 className="font-serif text-xl text-[#16241E] mb-5">
              Skills
            </h2>

            <textarea
              name="skills"
              value={profile.skills}
              onChange={handleChange}
              rows="4"
              placeholder="e.g. JavaScript, React, Node.js, MongoDB, Python"
              className="input w-full"
            />

            <p className="text-xs text-[#7A827D] mt-2">
              Separate your skills with commas.
            </p>
          </section>

          {/* EDUCATION */}
          <section className="bg-white border border-[#DCD8CC] rounded-2xl p-5 sm:p-6">
            <h2 className="font-serif text-xl text-[#16241E] mb-5">
              Education
            </h2>

            <textarea
              name="education"
              value={profile.education}
              onChange={handleChange}
              rows="4"
              placeholder="Tell employers about your education and qualifications."
              className="input w-full"
            />
          </section>

          {/* WORK EXPERIENCE */}
          <section className="bg-white border border-[#DCD8CC] rounded-2xl p-5 sm:p-6">
            <h2 className="font-serif text-xl text-[#16241E] mb-5">
              Work Experience
            </h2>

            <textarea
              name="experience"
              value={profile.experience}
              onChange={handleChange}
              rows="5"
              placeholder="Describe your previous work experience."
              className="input w-full"
            />
          </section>

          {/* PORTFOLIO */}
          <section className="bg-white border border-[#DCD8CC] rounded-2xl p-5 sm:p-6">
            <h2 className="font-serif text-xl text-[#16241E] mb-5">
              Portfolio / LinkedIn
            </h2>

            <input
              name="portfolio"
              value={profile.portfolio}
              onChange={handleChange}
              placeholder="https://..."
              className="input w-full"
            />
          </section>

          {/* MESSAGE */}
          {message && (
            <div className="bg-white border border-[#DCD8CC] rounded-xl p-4 text-sm text-[#47725A]">
              {message}
            </div>
          )}

          {/* SAVE */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#2F6F4E] text-white py-3.5 rounded-lg text-sm font-medium hover:bg-[#234F38] transition-colors disabled:opacity-60"
          >
            {saving ? "Saving Profile..." : "Save Profile"}
          </button>

        </form>
      </div>
    </div>
  );
}