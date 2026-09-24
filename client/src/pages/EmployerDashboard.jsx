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

export default function EmployerDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    api
      .get("/jobs/mine")
      .then((res) => setJobs(res.data))
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F5EE]">

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

        {/* =========================
            AI HERO
        ========================== */}
        <section className="relative overflow-hidden rounded-3xl bg-[#14231C] text-white mb-8">

          {/* Decorative AI circles */}
          <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full border border-[#5E9875]/30" />

          <div className="absolute right-8 top-8 w-40 h-40 rounded-full border border-[#5E9875]/20" />

          <div className="absolute -right-12 bottom-[-80px] w-56 h-56 rounded-full bg-[#2F6F4E]/20" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center p-6 sm:p-8 lg:p-12">

            {/* Left */}
            <div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#294535] text-[#A9D0B7] text-xs font-medium mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7FC497]" />
                SmartHire AI
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl leading-tight">
                Find people who{" "}
                <span className="text-[#9FD0AF]">
                  fit the role.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-[#D4DFD9] leading-relaxed max-w-xl mt-4">
                SmartHire analyses job requirements and candidate skills
                to help you discover relevant talent faster.
              </p>

              <p className="text-xs text-[#AFC2B7] mt-5">
                {today}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">

                <Link
                  to="/jobs/new"
                  className="inline-flex items-center justify-center bg-[#F7F5EE] text-[#16241E] px-5 py-3 rounded-lg text-sm font-medium hover:bg-white transition-colors"
                >
                  + Post a job
                </Link>

                {jobs.length > 0 && (
                  <a
                    href="#job-postings"
                    className="inline-flex items-center justify-center border border-[#668A75] text-[#E2EBE6] px-5 py-3 rounded-lg text-sm font-medium hover:bg-[#294535] transition-colors"
                  >
                    View your jobs
                  </a>
                )}

              </div>

            </div>


            {/* Right AI visualization */}
            <div className="hidden lg:flex justify-center">

              <div className="relative w-72 h-64">

                {/* Connecting lines */}
                <div className="absolute left-8 top-20 w-24 border-t border-[#557C65]" />
                <div className="absolute right-8 top-20 w-24 border-t border-[#557C65]" />
                <div className="absolute left-1/2 top-8 h-12 border-l border-[#557C65]" />
                <div className="absolute left-1/2 bottom-8 h-12 border-l border-[#557C65]" />

                {/* Candidate */}
                <div className="absolute left-0 top-12 w-20 h-20 rounded-2xl bg-[#22382C] border border-[#52745F] flex flex-col items-center justify-center">
                  <span className="text-xl">👤</span>
                  <span className="text-[10px] text-[#BFD1C7] mt-1">
                    Candidate
                  </span>
                </div>

                {/* AI */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-[#2F6F4E] border-4 border-[#406B53] flex flex-col items-center justify-center shadow-lg">
                  <span className="text-2xl">✦</span>
                  <span className="text-[10px] text-white mt-1">
                    AI Match
                  </span>
                </div>

                {/* Job */}
                <div className="absolute right-0 top-12 w-20 h-20 rounded-2xl bg-[#22382C] border border-[#52745F] flex flex-col items-center justify-center">
                  <span className="text-xl">💼</span>
                  <span className="text-[10px] text-[#BFD1C7] mt-1">
                    Job
                  </span>
                </div>

                {/* Score */}
                <div className="absolute left-1/2 bottom-0 -translate-x-1/2 px-4 py-2 rounded-full bg-[#E7F0EA] text-[#2F6F4E] text-xs font-semibold">
                  Compatibility
                </div>

              </div>

            </div>

          </div>
        </section>


        {/* =========================
            STATS
        ========================== */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">

          {/* Active Jobs */}
          <div className="bg-white border border-[#DCD8CC] rounded-2xl p-5 sm:p-6">

            <p className="text-xs uppercase tracking-wider text-[#7A827D]">
              Active jobs
            </p>

            <div className="flex items-end justify-between mt-2">

              <p className="font-serif text-4xl text-[#16241E]">
                {jobs.length}
              </p>

              <div className="w-10 h-10 rounded-full bg-[#E7F0EA] flex items-center justify-center text-[#2F6F4E]">
                💼
              </div>

            </div>

            <p className="text-xs text-[#8A918D] mt-1">
              Current job postings
            </p>

          </div>


          {/* AI */}
          <div className="bg-[#E7F0EA] border border-[#C9DACF] rounded-2xl p-5 sm:p-6">

            <p className="text-xs uppercase tracking-wider text-[#47725A]">
              Matching engine
            </p>

            <div className="flex items-end justify-between mt-2">

              <p className="font-serif text-2xl text-[#16241E]">
                AI-powered
              </p>

              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#2F6F4E]">
                ✦
              </div>

            </div>

            <p className="text-xs text-[#66806F] mt-2">
              Skills and job compatibility
            </p>

          </div>


          {/* Workflow */}
          <div className="bg-white border border-[#DCD8CC] rounded-2xl p-5 sm:p-6">

            <p className="text-xs uppercase tracking-wider text-[#7A827D]">
              Hiring workflow
            </p>

            <div className="flex items-end justify-between mt-2">

              <p className="font-serif text-2xl text-[#16241E]">
                Simple
              </p>

              <div className="w-10 h-10 rounded-full bg-[#F0F3EF] flex items-center justify-center text-[#2F6F4E]">
                ✓
              </div>

            </div>

            <p className="text-xs text-[#8A918D] mt-2">
              Post → Match → Review
            </p>

          </div>

        </section>


        {/* =========================
            JOB POSTINGS
        ========================== */}
        <section id="job-postings">

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">

            <div>

              <p className="text-xs uppercase tracking-[0.16em] text-[#2F6F4E] mb-1">
                AI-assisted hiring
              </p>

              <h2 className="font-serif text-2xl sm:text-3xl text-[#16241E]">
                Your job postings
              </h2>

            </div>

            {jobs.length > 0 && (
              <p className="text-xs text-[#7A827D]">
                {jobs.length}{" "}
                {jobs.length === 1 ? "active job" : "active jobs"}
              </p>
            )}

          </div>


          {jobs.length > 0 ? (

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {jobs.map((job) => (

                <article
                  key={job._id}
                  className="bg-white border border-[#DCD8CC] rounded-2xl p-5 sm:p-6 hover:border-[#9FBEAA] hover:shadow-sm transition-all"
                >

                  <div className="flex items-start justify-between gap-4">

                    <div className="min-w-0">

                      <div className="flex items-center gap-2 mb-3">

                        <span className="w-2 h-2 rounded-full bg-[#4F9669]" />

                        <span className="text-[11px] uppercase tracking-wider text-[#47725A] font-medium">
                          Published
                        </span>

                      </div>

                      <h3 className="font-serif text-xl sm:text-2xl text-[#16241E] leading-tight">
                        {job.title}
                      </h3>

                      <p className="text-sm text-[#737B76] mt-2">
                        📍 {job.location}
                      </p>

                    </div>

                    <div className="hidden sm:flex w-10 h-10 rounded-xl bg-[#F0F3EF] items-center justify-center text-[#2F6F4E]">
                      ✦
                    </div>

                  </div>


                  {/* AI explanation */}
                  <div className="mt-5 rounded-xl bg-[#F4F7F3] border border-[#E0E9E2] p-4">

                    <div className="flex items-start gap-3">

                      <div className="w-8 h-8 rounded-full bg-[#E1EEE5] flex items-center justify-center text-[#2F6F4E] shrink-0">
                        ✦
                      </div>

                      <div>

                        <p className="text-sm font-medium text-[#2B4435]">
                          Smart matching enabled
                        </p>

                        <p className="text-xs text-[#748078] mt-1 leading-relaxed">
                          Candidates can be compared with this job based
                          on the skills and requirements in their resumes.
                        </p>

                      </div>

                    </div>

                  </div>


                  <div className="border-t border-[#ECE9E1] mt-5 pt-5">

                    <Link
                      to={`/jobs/${job._id}/candidates`}
                      className="w-full inline-flex items-center justify-center gap-2 bg-[#2F6F4E] text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-[#234F38] transition-colors"
                    >
                      View matched candidates
                      <span>→</span>
                    </Link>

                  </div>

                </article>

              ))}

            </div>

          ) : (

            <div className="bg-white border border-[#DCD8CC] rounded-2xl p-8 sm:p-12 text-center">

              <div className="w-16 h-16 rounded-2xl bg-[#E7F0EA] flex items-center justify-center mx-auto mb-5 text-2xl">
                ✦
              </div>

              <p className="text-xs uppercase tracking-[0.16em] text-[#2F6F4E] mb-2">
                Start hiring with AI
              </p>

              <h3 className="font-serif text-2xl sm:text-3xl text-[#16241E]">
                Create your first job
              </h3>

              <p className="text-sm text-[#737B76] max-w-md mx-auto mt-3 leading-relaxed">
                Post your requirements and SmartHire will help you
                identify candidates whose skills are relevant to the role.
              </p>

              <Link
                to="/jobs/new"
                className="inline-flex items-center justify-center bg-[#2F6F4E] text-white px-5 py-3 rounded-lg text-sm font-medium mt-6 hover:bg-[#234F38] transition-colors"
              >
                + Post your first job
              </Link>

            </div>

          )}

        </section>

      </main>

    </div>
  );
}