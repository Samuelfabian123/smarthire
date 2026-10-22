import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const today = new Date().toLocaleDateString("en-NG", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default function JobSeekerDashboard() {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [matches, setMatches] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    try {
      const [profileRes, resumeRes, matchRes] = await Promise.all([
        api.get("/profile/jobseeker"),
        api.get("/resumes/mine"),
        api.get("/matches/mine"),
      ]);

      setProfile(profileRes.data);
      setResumes(resumeRes.data);
      setMatches(matchRes.data);
    } catch (err) {
      console.error("Dashboard loading error:", err);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleUpload(e) {
    e.preventDefault();

    if (!file) return;

    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("resume", file);

      await api.post("/resumes/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage("Resume uploaded.");
      setFile(null);
      loadData();
    } catch (err) {
      setMessage(
        err.response?.data?.error || "Upload failed"
      );
    } finally {
      setUploading(false);
    }
  }

  const firstName =
    profile?.fullName?.split(" ")[0] ||
    user?.name?.split(" ")[0] ||
    "there";

  return (
    <div className="min-h-screen bg-[#F7F5EE] px-4 py-8 sm:py-10">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <div className="mb-8">
          <p className="text-xs text-[#737B76] mb-1">
            {today}
          </p>

          <h1 className="font-serif text-3xl sm:text-4xl text-[#16241E]">
            Welcome, {firstName}
          </h1>

          <p className="text-sm text-[#737B76] mt-2">
            Manage your professional profile, resume and job matches.
          </p>
        </div>


        {/* PROFILE CARD */}
        <section className="bg-white border border-[#DCD8CC] rounded-2xl p-5 sm:p-6 mb-8">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">

            <div className="flex items-center gap-4">

              {/* PROFILE PHOTO */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-[#E7F0EA] border border-[#DCD8CC] flex items-center justify-center flex-shrink-0">

                {profile?.photoUrl ? (
                  <img
                    src={profile.photoUrl}
                    alt={profile.fullName || "Profile"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl">
                    👤
                  </span>
                )}

              </div>


              {/* PROFILE INFORMATION */}
              <div>

                <p className="text-xs uppercase tracking-[0.16em] text-[#2F6F4E] mb-1">
                  Professional Profile
                </p>

                <h2 className="font-serif text-2xl text-[#16241E]">
                  {profile?.fullName || user?.name || "Your Profile"}
                </h2>

                <p className="text-sm text-[#737B76] mt-1">
                  {profile?.professionalTitle ||
                    "Add your professional title"}
                </p>

                {profile?.location && (
                  <p className="text-xs text-[#737B76] mt-2">
                    📍 {profile.location}
                  </p>
                )}

              </div>

            </div>


            {/* PROFILE BUTTON */}
            <Link
              to="/dashboard/jobseeker/profile"
              className="bg-[#2F6F4E] text-white px-5 py-3 rounded-lg text-sm font-medium text-center hover:bg-[#234F38] transition-colors whitespace-nowrap"
            >
              Edit Profile
            </Link>

          </div>


          {/* PROFILE DETAILS */}
          {profile && (
            <div className="mt-6 pt-5 border-t border-[#DCD8CC] grid grid-cols-1 sm:grid-cols-2 gap-4">

              {profile.phone && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#737B76]">
                    Phone
                  </p>
                  <p className="text-sm text-[#16241E] mt-1">
                    {profile.phone}
                  </p>
                </div>
              )}

              {profile.portfolio && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-[#737B76]">
                    Portfolio
                  </p>
                  <p className="text-sm text-[#16241E] mt-1 break-all">
                    {profile.portfolio}
                  </p>
                </div>
              )}

              {profile.skills && (
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-[#737B76]">
                    Skills
                  </p>
                  <p className="text-sm text-[#16241E] mt-1">
                    {profile.skills}
                  </p>
                </div>
              )}

              {profile.about && (
                <div className="sm:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-[#737B76]">
                    About
                  </p>
                  <p className="text-sm text-[#16241E] mt-1 leading-6">
                    {profile.about}
                  </p>
                </div>
              )}

            </div>
          )}

        </section>


        {/* RESUME */}
        <section className="mb-10">

          <h2 className="font-serif text-xl text-[#16241E] mb-4">
            Your resume
          </h2>

          <form
            onSubmit={handleUpload}
            className="bg-white border border-[#DCD8CC] rounded-2xl p-5 sm:p-6"
          >

            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">

              <input
                type="file"
                accept=".pdf,.docx"
                onChange={(e) =>
                  setFile(e.target.files[0])
                }
                className="text-sm text-[#737B76] w-full"
              />

              <button
                type="submit"
                disabled={uploading || !file}
                className="bg-[#2F6F4E] text-white px-5 py-3 rounded-lg text-sm font-medium hover:bg-[#234F38] transition-colors disabled:opacity-60 whitespace-nowrap"
              >
                {uploading
                  ? "Uploading..."
                  : "Upload Resume"}
              </button>

            </div>

            {message && (
              <p className="text-sm text-[#47725A] mt-4">
                {message}
              </p>
            )}

          </form>


          <div className="bg-white border border-[#DCD8CC] rounded-2xl mt-4 divide-y divide-[#DCD8CC]">

            {resumes.map((r) => (
              <div
                key={r._id}
                className="p-4 text-sm text-[#16241E]"
              >
                {r.fileName}
              </div>
            ))}

            {resumes.length === 0 && (
              <div className="p-5 text-sm text-[#737B76]">
                No resume uploaded yet.
              </div>
            )}

          </div>

        </section>


        {/* MATCH SCORES */}
        <section>

          <h2 className="font-serif text-xl text-[#16241E] mb-4">
            Your match scores
          </h2>

          <div className="bg-white border border-[#DCD8CC] rounded-2xl divide-y divide-[#DCD8CC]">

            {matches.map((m) => (
              <div
                key={m._id}
                className="p-4 flex justify-between items-center text-sm"
              >

                <div>
                  <p className="text-[#16241E] font-medium">
                    {m.job?.title}
                  </p>

                  <p className="text-[#737B76]">
                    {m.job?.location}
                  </p>
                </div>

                <span className="font-serif text-2xl text-[#2F6F4E]">
                  {(m.finalScore * 100).toFixed(0)}%
                </span>

              </div>
            ))}

            {matches.length === 0 && (
              <div className="p-5 text-sm text-[#737B76]">
                No matches yet — browse jobs and check your score against one.
              </div>
            )}

          </div>

        </section>

      </div>
    </div>
  );
}