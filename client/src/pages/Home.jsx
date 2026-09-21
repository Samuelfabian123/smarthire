import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const categories = [
  { name: "Technology", count: "1,240+ jobs", icon: "💻" },
  { name: "Finance", count: "680+ jobs", icon: "💰" },
  { name: "Marketing", count: "520+ jobs", icon: "📣" },
  { name: "Healthcare", count: "410+ jobs", icon: "🏥" },
  { name: "Engineering", count: "390+ jobs", icon: "⚙️" },
  { name: "Education", count: "350+ jobs", icon: "🎓" },
];

const locations = [
  "Lagos",
  "Abuja",
  "Port Harcourt",
  "Ibadan",
  "Kano",
  "Enugu",
];

export default function Home() {
  const { user } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [searchActive, setSearchActive] = useState(false);

  useEffect(() => {
    api
      .get("/jobs")
      .then((res) => {
        setJobs(res.data || []);
      })
      .catch((err) => {
        console.error("Failed to load homepage jobs:", err);
      })
      .finally(() => {
        setLoadingJobs(false);
      });
  }, []);

  const filteredJobs = useMemo(() => {
    const keywordValue = keyword.trim().toLowerCase();
    const locationValue = location.trim().toLowerCase();

    if (!keywordValue && !locationValue) {
      return jobs.slice(0, 3);
    }

    return jobs.filter((job) => {
      const title = job.title || "";
      const description = job.description || "";
      const jobLocation = job.location || "";
      const skills = Array.isArray(job.skills)
        ? job.skills.join(" ")
        : job.skills || "";

      const searchableText = `
        ${title}
        ${description}
        ${skills}
      `.toLowerCase();

      const matchesKeyword =
        !keywordValue || searchableText.includes(keywordValue);

      const matchesLocation =
        !locationValue ||
        jobLocation.toLowerCase().includes(locationValue);

      return matchesKeyword && matchesLocation;
    });
  }, [jobs, keyword, location]);

  const displayedJobs = searchActive
    ? filteredJobs
    : jobs.slice(0, 3);

  function handleSearch(event) {
    event.preventDefault();
    setSearchActive(true);

    setTimeout(() => {
      document
        .getElementById("job-results")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  }

  function handleCategorySearch(categoryName) {
    setKeyword(categoryName);
    setLocation("");
    setSearchActive(true);

    setTimeout(() => {
      document
        .getElementById("job-results")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  }

  function handleLocationSearch(locationName) {
    setKeyword("");
    setLocation(locationName);
    setSearchActive(true);

    setTimeout(() => {
      document
        .getElementById("job-results")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  }

  function clearSearch() {
    setKeyword("");
    setLocation("");
    setSearchActive(false);
  }

  return (
    <div className="min-h-screen bg-[#F7F5EE] text-[#16241E]">
      {/* Hero */}
      <section className="border-b border-[#DCD8CC]">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="mb-6 inline-flex items-center rounded-full border border-[#C9D8CE] bg-white px-4 py-2 text-sm text-[#2F6F4E]">
                <span className="mr-2 h-2 w-2 rounded-full bg-[#2F6F4E]" />
                Built for the Nigerian job market
              </div>

              <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight md:text-7xl">
                Find work that fits your{" "}
                <span className="text-[#2F6F4E]">skills.</span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-[#52605A] md:text-xl">
                SmartHire helps Nigerian job seekers discover relevant
                opportunities and helps employers find candidates based on
                what they can actually do.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                {user ? (
                  <>
                    <Link
                      to="/jobs"
                      className="rounded-md bg-[#2F6F4E] px-6 py-3 font-medium text-white transition hover:bg-[#234F38]"
                    >
                      Browse jobs
                    </Link>

                    <Link
                      to="/dashboard"
                      className="rounded-md border border-[#16241E] px-6 py-3 font-medium transition hover:bg-[#16241E] hover:text-white"
                    >
                      Go to dashboard
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/jobs"
                      className="rounded-md bg-[#2F6F4E] px-6 py-3 font-medium text-white transition hover:bg-[#234F38]"
                    >
                      Find jobs
                    </Link>

                    <Link
                      to="/register"
                      className="rounded-md border border-[#16241E] px-6 py-3 font-medium transition hover:bg-[#16241E] hover:text-white"
                    >
                      Create an account
                    </Link>
                  </>
                )}
              </div>

              <div className="mt-8 flex flex-wrap gap-6 text-sm text-[#52605A]">
                <span>✓ AI-powered matching</span>
                <span>✓ Nigerian opportunities</span>
                <span>✓ Simple applications</span>
              </div>
            </div>

            {/* Match Card */}
            <div className="rounded-2xl border border-[#DCD8CC] bg-white p-6 shadow-sm md:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#68756F]">SmartHire match</p>

                  <h2 className="mt-1 text-2xl font-semibold">
                    Backend Developer
                  </h2>
                </div>

                <div className="flex h-20 w-20 items-center justify-center rounded-full border-8 border-[#DCE9E0] text-xl font-semibold text-[#2F6F4E]">
                  87%
                </div>
              </div>

              <div className="mt-7 space-y-4">
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>Python</span>
                    <span className="text-[#2F6F4E]">Strong match</span>
                  </div>

                  <div className="h-2 rounded-full bg-[#E8E5DC]">
                    <div className="h-2 w-[90%] rounded-full bg-[#2F6F4E]" />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>REST APIs</span>
                    <span className="text-[#2F6F4E]">Strong match</span>
                  </div>

                  <div className="h-2 rounded-full bg-[#E8E5DC]">
                    <div className="h-2 w-[85%] rounded-full bg-[#2F6F4E]" />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>SQL</span>
                    <span className="text-[#2F6F4E]">Good match</span>
                  </div>

                  <div className="h-2 rounded-full bg-[#E8E5DC]">
                    <div className="h-2 w-[78%] rounded-full bg-[#2F6F4E]" />
                  </div>
                </div>
              </div>

              <div className="mt-7 rounded-lg bg-[#F3F6F2] p-4 text-sm leading-6 text-[#52605A]">
                SmartHire compares the content of your resume with job
                requirements to estimate how closely your skills match the
                opportunity.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="mx-auto max-w-7xl px-6 py-10 md:px-10">
        <form
          onSubmit={handleSearch}
          className="rounded-2xl bg-[#16241E] p-5 md:p-7"
        >
          <div className="mb-4">
            <p className="text-sm font-medium uppercase tracking-widest text-[#AFC7B8]">
              Search opportunities
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white md:text-2xl">
              Find a job that matches what you can do.
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <input
              type="text"
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value);
                setSearchActive(false);
              }}
              placeholder="Job title, skill or keyword"
              className="rounded-md border-0 bg-white px-4 py-3 text-[#16241E] outline-none ring-0 placeholder:text-[#8A938E] focus:ring-2 focus:ring-[#AFC7B8]"
            />

            <input
              type="text"
              value={location}
              onChange={(event) => {
                setLocation(event.target.value);
                setSearchActive(false);
              }}
              placeholder="Location e.g. Lagos"
              className="rounded-md border-0 bg-white px-4 py-3 text-[#16241E] outline-none ring-0 placeholder:text-[#8A938E] focus:ring-2 focus:ring-[#AFC7B8]"
            />

            <button
              type="submit"
              className="rounded-md bg-[#DDE9DF] px-7 py-3 text-center font-medium text-[#16241E] transition hover:bg-white"
            >
              Search jobs
            </button>
          </div>

          {(keyword || location) && (
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[#C5CEC9]">
              <span>
                Searching for{" "}
                <strong className="text-white">
                  {keyword || "all jobs"}
                </strong>
                {location && (
                  <>
                    {" "}
                    in{" "}
                    <strong className="text-white">{location}</strong>
                  </>
                )}
              </span>

              <button
                type="button"
                onClick={clearSearch}
                className="rounded-full border border-[#52605A] px-3 py-1 text-xs transition hover:border-white hover:text-white"
              >
                Clear search
              </button>
            </div>
          )}
        </form>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-6 py-14 md:px-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-[#2F6F4E]">
              Explore opportunities
            </p>

            <h2 className="mt-2 text-3xl font-semibold md:text-4xl">
              Popular job categories
            </h2>
          </div>

          <Link
            to="/jobs"
            className="hidden text-sm font-medium text-[#2F6F4E] md:block"
          >
            View all jobs →
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <button
              key={category.name}
              type="button"
              onClick={() => handleCategorySearch(category.name)}
              className="group rounded-xl border border-[#DCD8CC] bg-white p-6 text-left transition hover:-translate-y-1 hover:border-[#AFC7B8] hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-3xl">{category.icon}</span>

                <span className="text-[#9AA49F] transition group-hover:text-[#2F6F4E]">
                  →
                </span>
              </div>

              <h3 className="mt-6 text-xl font-semibold">
                {category.name}
              </h3>

              <p className="mt-2 text-sm text-[#68756F]">
                {category.count}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Real Jobs */}
      <section
        id="job-results"
        className="scroll-mt-8 border-y border-[#DCD8CC] bg-white"
      >
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-[#2F6F4E]">
                {searchActive ? "Search results" : "Opportunities"}
              </p>

              <h2 className="mt-2 text-3xl font-semibold md:text-4xl">
                {searchActive ? "Jobs matching your search" : "Latest jobs"}
              </h2>

              {searchActive && !loadingJobs && (
                <p className="mt-2 text-sm text-[#68756F]">
                  {displayedJobs.length}{" "}
                  {displayedJobs.length === 1 ? "job" : "jobs"} found
                </p>
              )}
            </div>

            <div className="flex items-center gap-4">
              {searchActive && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="hidden text-sm font-medium text-[#68756F] transition hover:text-[#2F6F4E] md:block"
                >
                  Show latest
                </button>
              )}

              <Link
                to="/jobs"
                className="hidden text-sm font-medium text-[#2F6F4E] md:block"
              >
                Browse all →
              </Link>
            </div>
          </div>

          {loadingJobs ? (
            <div className="mt-8 rounded-xl border border-[#DCD8CC] bg-[#F7F5EE] p-8 text-center text-[#68756F]">
              Loading jobs...
            </div>
          ) : displayedJobs.length > 0 ? (
            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {displayedJobs.map((job) => (
                <div
                  key={job._id}
                  className="rounded-xl border border-[#DCD8CC] bg-[#F7F5EE] p-6 transition hover:-translate-y-1 hover:shadow-sm"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#DDE9DF] text-xl font-semibold text-[#2F6F4E]">
                    {job.title?.charAt(0)?.toUpperCase() || "J"}
                  </div>

                  <h3 className="mt-5 text-xl font-semibold">
                    {job.title}
                  </h3>

                  <p className="mt-2 text-sm text-[#52605A]">
                    📍 {job.location || "Nigeria"}
                  </p>

                  <p className="mt-5 text-sm leading-6 text-[#68756F]">
                    {job.description
                      ? `${job.description.slice(0, 150)}${
                          job.description.length > 150 ? "..." : ""
                        }`
                      : "View this opportunity to learn more about the role."}
                  </p>

                  <Link
                    to="/jobs"
                    className="mt-6 block rounded-md border border-[#2F6F4E] px-4 py-3 text-center text-sm font-medium text-[#2F6F4E] transition hover:bg-[#2F6F4E] hover:text-white"
                  >
                    View job
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-[#DCD8CC] bg-[#F7F5EE] p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E9EFE9] text-2xl">
                🔎
              </div>

              <h3 className="mt-5 text-xl font-semibold">
                No matching jobs found
              </h3>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#68756F]">
                We couldn't find a job matching your current search. Try
                another keyword, skill, or Nigerian location.
              </p>

              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={clearSearch}
                  className="rounded-md bg-[#2F6F4E] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#234F38]"
                >
                  Show latest jobs
                </button>

                <Link
                  to="/jobs"
                  className="rounded-md border border-[#16241E] px-5 py-3 text-sm font-medium transition hover:bg-[#16241E] hover:text-white"
                >
                  Browse all jobs
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-widest text-[#2F6F4E]">
            How SmartHire works
          </p>

          <h2 className="mt-2 text-3xl font-semibold md:text-4xl">
            A simpler way to connect skills with opportunities.
          </h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-[#DCD8CC] bg-white p-7">
            <div className="text-3xl font-semibold text-[#2F6F4E]">
              01
            </div>

            <h3 className="mt-6 text-xl font-semibold">
              Create your profile
            </h3>

            <p className="mt-3 leading-7 text-[#68756F]">
              Register and upload your resume so SmartHire can understand your
              skills and experience.
            </p>
          </div>

          <div className="rounded-xl border border-[#DCD8CC] bg-white p-7">
            <div className="text-3xl font-semibold text-[#2F6F4E]">
              02
            </div>

            <h3 className="mt-6 text-xl font-semibold">
              Discover relevant jobs
            </h3>

            <p className="mt-3 leading-7 text-[#68756F]">
              Browse available opportunities and see how closely your resume
              matches each job.
            </p>
          </div>

          <div className="rounded-xl border border-[#DCD8CC] bg-white p-7">
            <div className="text-3xl font-semibold text-[#2F6F4E]">
              03
            </div>

            <h3 className="mt-6 text-xl font-semibold">
              Apply with confidence
            </h3>

            <p className="mt-3 leading-7 text-[#68756F]">
              Use your match score as another piece of information when
              deciding which opportunities to pursue.
            </p>
          </div>
        </div>
      </section>

      {/* AI Matching */}
      <section className="bg-[#E9EFE9]">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-[#2F6F4E]">
                AI-powered matching
              </p>

              <h2 className="mt-3 text-3xl font-semibold md:text-5xl">
                Match based on skills, not just job titles.
              </h2>

              <p className="mt-5 max-w-xl text-lg leading-8 text-[#52605A]">
                SmartHire combines traditional text similarity with
                Sentence-BERT semantic similarity to compare resumes and job
                descriptions.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <span className="rounded-full bg-white px-4 py-2 text-sm">
                  TF-IDF · 40%
                </span>

                <span className="rounded-full bg-white px-4 py-2 text-sm">
                  Sentence-BERT · 60%
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#C9D8CE] bg-white p-7">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#68756F]">
                  Example match score
                </span>

                <span className="text-4xl font-semibold text-[#2F6F4E]">
                  84%
                </span>
              </div>

              <div className="mt-6 h-3 rounded-full bg-[#E5E8E3]">
                <div className="h-3 w-[84%] rounded-full bg-[#2F6F4E]" />
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-[#F7F5EE] p-4">
                  <p className="text-xs uppercase tracking-wide text-[#7A847F]">
                    Resume
                  </p>

                  <p className="mt-2 font-medium">
                    Python · Flask · SQL
                  </p>
                </div>

                <div className="rounded-lg bg-[#F7F5EE] p-4">
                  <p className="text-xs uppercase tracking-wide text-[#7A847F]">
                    Job
                  </p>

                  <p className="mt-2 font-medium">
                    Python · REST APIs · SQL
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Locations */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-[#2F6F4E]">
            Jobs across Nigeria
          </p>

          <h2 className="mt-2 text-3xl font-semibold md:text-4xl">
            Explore opportunities by location
          </h2>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {locations.map((locationName) => (
            <button
              key={locationName}
              type="button"
              onClick={() => handleLocationSearch(locationName)}
              className="rounded-full border border-[#DCD8CC] bg-white px-5 py-3 text-sm transition hover:border-[#2F6F4E] hover:text-[#2F6F4E]"
            >
              📍 {locationName}
            </button>
          ))}
        </div>
      </section>

      {/* Employer CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-16 md:px-10">
        <div className="overflow-hidden rounded-2xl bg-[#16241E] px-7 py-12 text-white md:px-12">
          <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-[#AFC7B8]">
                For employers
              </p>

              <h2 className="mt-3 max-w-2xl text-3xl font-semibold md:text-5xl">
                Find people whose skills fit the job.
              </h2>

              <p className="mt-4 max-w-2xl leading-7 text-[#C5CEC9]">
                Post your opportunity and let SmartHire help you compare
                candidates against the requirements of the role.
              </p>
            </div>

            <Link
              to="/post-job"
              className="rounded-md bg-white px-6 py-3 text-center font-medium text-[#16241E] transition hover:bg-[#E9EFE9]"
            >
              Post a job
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#DCD8CC] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8 text-sm text-[#68756F] md:flex-row md:items-center md:justify-between md:px-10">
          <div>
            <p className="font-semibold text-[#16241E]">SmartHire</p>

            <p className="mt-1">
              Connecting Nigerian talent with opportunity.
            </p>
          </div>

          <div className="flex gap-5">
            <Link
              to="/jobs"
              className="transition hover:text-[#2F6F4E]"
            >
              Browse jobs
            </Link>

            <Link
              to="/register"
              className="transition hover:text-[#2F6F4E]"
            >
              Register
            </Link>

            <Link
              to="/login"
              className="transition hover:text-[#2F6F4E]"
            >
              Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}