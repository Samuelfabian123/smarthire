import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Bot,
  BriefcaseBusiness,
  Send,
  Sparkles,
  Target,
  GraduationCap,
  LoaderCircle,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import api from "../api/axios";

const suggestions = [
  {
    icon: BriefcaseBusiness,
    title: "Find jobs",
    prompt: "Find jobs that match my skills",
  },
  {
    icon: Target,
    title: "My match results",
    prompt: "Explain my match results and missing skills",
  },
  {
    icon: GraduationCap,
    title: "Skills to learn",
    prompt: "What skills should I learn to improve my career?",
  },
  {
    icon: Sparkles,
    title: "Career advice",
    prompt: "Give me career advice based on my profile",
  },
];

function ResultCards({ response }) {
  if (!response?.data) return null;

  const data = response.data;

  if (response.toolUsed === "search_jobs") {
    if (!data.length) return null;

    return (
      <div className="mt-4 grid gap-3">
        {data.map((job) => (
          <div
            key={job.id}
            className="rounded-xl border border-emerald-100 bg-white p-4"
          >
            <h4 className="font-bold text-slate-900">{job.title}</h4>

            <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <MapPin size={15} />
              {job.location}
            </p>

            {job.skillsRequired?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {job.skillsRequired.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}

            {job.description && (
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {job.description}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (response.toolUsed === "explain_match_results") {
    if (!data.length) return null;

    return (
      <div className="mt-4 grid gap-3">
        {data.map((match, index) => (
          <div
            key={`${match.jobTitle}-${index}`}
            className="rounded-xl border border-emerald-100 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-bold text-slate-900">
                  {match.jobTitle}
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  {match.location}
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
                {match.score}% match
              </span>
            </div>

            {match.matchedSkills?.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Matched skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {match.matchedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {match.missingSkills?.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-700">
                  Skills to improve
                </p>
                <div className="flex flex-wrap gap-2">
                  {match.missingSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (response.toolUsed === "analyse_skill_gaps") {
    return (
      <div className="mt-4 rounded-xl border border-emerald-100 bg-white p-4">
        {data.currentSkills?.length > 0 && (
          <div className="mb-4">
            <h4 className="font-bold text-slate-900">Your current skills</h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {data.currentSkills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-800"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {data.recommendations?.length > 0 && (
          <div>
            <h4 className="font-bold text-slate-900">
              Skills worth developing
            </h4>
            <div className="mt-3 grid gap-2">
              {data.recommendations.map((skill) => (
                <div key={skill} className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                  {skill}
                </div>
              ))}
            </div>
          </div>
        )}

        {data.rolesAnalysed?.length > 0 && (
          <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
            Based on job listings for: {data.rolesAnalysed.join(", ")}
          </p>
        )}
      </div>
    );
  }

  if (response.toolUsed === "career_guidance") {
    return (
      <div className="mt-4 grid gap-3">
        {data.suggestions?.map((suggestion, index) => (
          <div key={index} className="flex gap-3 rounded-xl border border-emerald-100 bg-white p-4">
            <CheckCircle2
              size={19}
              className="mt-0.5 shrink-0 text-emerald-600"
            />
            <p className="text-sm leading-6 text-slate-700">{suggestion}</p>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

export default function CareerAgent() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendMessage(text = input) {
    const message = text.trim();

    if (!message || loading) return;

    setMessages((previous) => [
      ...previous,
      { role: "user", content: message },
    ]);

    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/agent/chat", { message });

      setMessages((previous) => [
        ...previous,
        {
          role: "agent",
          content: response.data.message,
          result: response.data,
        },
      ]);
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        "I couldn't connect to the Career Agent. Please try again.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F5EE] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/dashboard/jobseeker"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-emerald-700"
        >
          <ArrowLeft size={17} />
          Back to dashboard
        </Link>

        <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
          <header className="bg-[#16241E] px-6 py-8 text-white sm:px-9">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300">
                <Bot size={30} />
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                  <Sparkles size={14} />
                  SmartHire Intelligence
                </div>

                <h1 className="text-2xl font-bold sm:text-3xl">
                  AI Career Agent
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  Explore job opportunities, understand your match results,
                  identify skill gaps, and get practical career guidance
                  based on SmartHire data.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {["Job discovery", "Match analysis", "Skill development"].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-200"
                  >
                    {item}
                  </span>
                )
              )}
            </div>
          </header>

          <div className="p-4 sm:p-8">
            {messages.length === 0 ? (
              <div className="py-5">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <Bot size={32} />
                </div>

                <h2 className="mt-5 text-center text-xl font-bold text-[#16241E]">
                  How can I help your career today?
                </h2>

                <p className="mx-auto mt-2 max-w-lg text-center text-sm leading-6 text-slate-500">
                  Ask a question or choose one of the actions below to get
                  started.
                </p>

                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {suggestions.map((item) => {
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => sendMessage(item.prompt)}
                        disabled={loading}
                        className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50/60 disabled:opacity-50"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                          <Icon size={20} />
                        </span>

                        <span>
                          <span className="block font-semibold text-slate-800">
                            {item.title}
                          </span>
                          <span className="mt-1 block text-sm leading-5 text-slate-500">
                            {item.prompt}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={
                      message.role === "user"
                        ? "flex justify-end"
                        : "flex justify-start"
                    }
                  >
                    <div
                      className={
                        message.role === "user"
                          ? "max-w-[90%] rounded-2xl rounded-br-sm bg-[#2F6F4E] px-4 py-3 text-sm leading-6 text-white sm:max-w-[75%]"
                          : "w-full max-w-3xl rounded-2xl rounded-bl-sm bg-[#F7F5EE] p-4 sm:p-5"
                      }
                    >
                      {message.role === "agent" && (
                        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-800">
                          <Bot size={18} />
                          SmartHire Career Agent
                        </div>
                      )}

                      <p className="whitespace-pre-wrap text-sm leading-6">
                        {message.content}
                      </p>

                      {message.result && (
                        <ResultCards response={message.result} />
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
                    <LoaderCircle size={19} className="animate-spin" />
                    Checking SmartHire data...
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setMessages([])}
                  className="text-sm font-semibold text-emerald-700 hover:text-emerald-900"
                >
                  Start a new conversation
                </button>
              </div>
            )}

            {error && messages.length === 0 && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage();
              }}
              className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm focus-within:border-emerald-400"
            >
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about jobs, matches, skills, or your career..."
                maxLength={1000}
                disabled={loading}
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />

              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2F6F4E] text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send message"
              >
                {loading ? (
                  <LoaderCircle size={19} className="animate-spin" />
                ) : (
                  <Send size={19} />
                )}
              </button>
            </form>

            <p className="mt-3 text-center text-xs leading-5 text-slate-400">
              Recommendations use your SmartHire profile and available job
              listings. Review job details before applying.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}