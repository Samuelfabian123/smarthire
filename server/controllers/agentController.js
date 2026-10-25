const Job = require("../models/Job");
const Match = require("../models/Match");
const JobSeekerProfile = require("../models/JobSeekerProfile");

// Convert text into searchable words.
function normalize(text = "") {
  return String(text).toLowerCase().trim();
}

// Identify the user's requested action.
function detectIntent(message) {
  const text = normalize(message);

  if (
    /\b(match score|my match|match results|matched skills|missing skills|why.*match|explain.*match|compatibility)\b/.test(
      text
    )
  ) {
    return "matches";
  }

  if (
    /\b(skill gap|skill gaps|skills.*learn|learn.*skills|missing skill|improve.*skills|upskill)\b/.test(
      text
    )
  ) {
    return "skills";
  }

  if (
    /\b(find jobs|search jobs|show jobs|available jobs|job openings|vacancies|jobs for|job in|jobs in|job near|developer jobs|designer jobs|analyst jobs)\b/.test(
      text
    ) ||
    /\b(find|search|show|recommend|suggest)\b.*\b(jobs|vacancies|openings|roles|positions)\b/.test(
      text
    )
  ) {
    return "jobs";
  }

  return "career";
}

// Read the current job seeker's profile.
async function getProfile(userId) {
  return JobSeekerProfile.findOne({ user: userId }).lean();
}

// Search actual jobs stored in MongoDB.
async function searchJobs(message, profile) {
  const text = normalize(message);

  const stopWords = new Set([
    "find", "search", "show", "me", "some", "available",
    "jobs", "job", "for", "the", "a", "an", "in", "at",
    "near", "with", "and", "or", "please", "recommend",
    "suggest", "openings", "vacancies", "roles", "positions",
    "my", "based", "on", "skills", "career", "opportunities",
    "remote", "work", "looking", "want", "need", "get",
  ]);

  const words = text
    .replace(/[^\w\s+#.-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !stopWords.has(word));

  const profileSkills = String(profile?.skills || "")
    .split(/[,;\n]/)
    .map((skill) => skill.trim())
    .filter(Boolean);

  const terms = [...new Set([...words, ...profileSkills])].slice(0, 15);

  let jobs = await Job.find({})
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  // Prefer jobs relevant to the request or the user's skills.
  const scoredJobs = jobs
    .map((job) => {
      const searchableText = normalize(
        `${job.title || ""} ${job.description || ""} ${
          job.location || ""
        } ${(job.skillsRequired || []).join(" ")}`
      );

      let score = 0;

      for (const term of terms) {
        if (searchableText.includes(normalize(term))) {
          score += 1;
        }
      }

      return { job, score };
    })
    .filter((item) => item.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.job.createdAt || 0) -
          new Date(a.job.createdAt || 0)
    );

  // When the request is broad, show the newest available listings.
  if (scoredJobs.length === 0 && words.length <= 2) {
    return jobs.slice(0, 5).map((job) => ({
      id: job._id,
      title: job.title,
      location: job.location || "Location not specified",
      skillsRequired: job.skillsRequired || [],
      description: String(job.description || "").slice(0, 180),
    }));
  }

  return scoredJobs.slice(0, 5).map(({ job }) => ({
    id: job._id,
    title: job.title,
    location: job.location || "Location not specified",
    skillsRequired: job.skillsRequired || [],
    description: String(job.description || "").slice(0, 180),
  }));
}

// Career Agent API endpoint.
exports.chatWithAgent = async (req, res) => {
  try {
    const message = String(req.body.message || "").trim();

    if (!message) {
      return res.status(400).json({
        error: "Please enter a question for your Career Agent.",
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        error: "Please keep your message under 1,000 characters.",
      });
    }

    const userId = req.user.id;
    const intent = detectIntent(message);
    const profile = await getProfile(userId);

    // TOOL 1: Search real jobs in SmartHire.
    if (intent === "jobs") {
      const jobs = await searchJobs(message, profile);

      return res.json({
        agent: "SmartHire AI Career Agent",
        toolUsed: "search_jobs",
        message:
          jobs.length > 0
            ? `I searched SmartHire's job listings and found ${jobs.length} relevant result(s).`
            : "I couldn't find a matching job in the current SmartHire listings. Try another job title or skill.",
        data: jobs,
      });
    }

    // TOOL 2: Read the current user's saved match results.
    if (intent === "matches") {
      const matches = await Match.find({ jobSeeker: userId })
        .populate("job", "title location skillsRequired description")
        .sort({ finalScore: -1 })
        .limit(10)
        .lean();

      const results = matches
        .filter((match) => match.job)
        .map((match) => ({
          jobTitle: match.job.title,
          location: match.job.location || "Location not specified",
          score: Math.round((match.finalScore || 0) * 100),
          matchedSkills: match.matchedSkills || [],
          missingSkills: match.missingSkills || [],
          requiredSkills: match.requiredSkills || [],
        }));

      return res.json({
        agent: "SmartHire AI Career Agent",
        toolUsed: "explain_match_results",
        message:
          results.length > 0
            ? "Here are your saved CV-to-job match results, ranked by compatibility."
            : "You don't have any saved match results yet. Browse jobs, upload your CV, and check your match score first.",
        data: results,
      });
    }

    // TOOL 3: Compare profile skills against job requirements.
    if (intent === "skills") {
      if (!profile) {
        return res.json({
          agent: "SmartHire AI Career Agent",
          toolUsed: "analyse_skill_gaps",
          message:
            "Complete your professional profile and add your skills so I can give you more relevant recommendations.",
          data: {
            currentSkills: [],
            recommendations: [],
          },
        });
      }

      const currentSkills = String(profile.skills || "")
        .split(/[,;\n]/)
        .map((skill) => skill.trim())
        .filter(Boolean);

      const jobs = await Job.find({})
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      const requestedTerms = normalize(message)
        .replace(/[^\w\s+#.-]/g, " ")
        .split(/\s+/)
        .filter(
          (word) =>
            word.length > 2 &&
            ![
              "what", "which", "skills", "skill", "should",
              "learn", "missing", "improve", "recommend",
              "develop", "gaps", "need", "for", "the",
            ].includes(word)
        );

      const relevantJobs = jobs
        .map((job) => {
          const title = normalize(job.title);
          const relevant =
            requestedTerms.length === 0 ||
            requestedTerms.some((term) => title.includes(term));

          return { job, relevant };
        })
        .filter((item) => item.relevant)
        .slice(0, 10);

      const requiredSkills = [
        ...new Set(
          relevantJobs.flatMap(
            ({ job }) => job.skillsRequired || []
          )
        ),
      ];

      const missingSkills = requiredSkills.filter(
        (required) =>
          !currentSkills.some(
            (current) =>
              normalize(current) === normalize(required)
          )
      );

      return res.json({
        agent: "SmartHire AI Career Agent",
        toolUsed: "analyse_skill_gaps",
        message:
          requiredSkills.length > 0
            ? "I compared your profile skills with requirements from relevant SmartHire job listings. These are potential skills to develop, not a guarantee of employment."
            : "I couldn't identify enough relevant job requirements to calculate skill gaps. Try naming a role such as React Developer or Data Analyst.",
        data: {
          currentSkills,
          skillsCompared: requiredSkills,
          recommendations: missingSkills.slice(0, 10),
          rolesAnalysed: relevantJobs.map(({ job }) => job.title),
        },
      });
    }

    // TOOL 4: Provide profile-based career guidance.
    const skills = String(profile?.skills || "")
      .split(/[,;\n]/)
      .map((skill) => skill.trim())
      .filter(Boolean);

    const title = profile?.professionalTitle || "your target role";

    const suggestions = [];

    if (!profile) {
      suggestions.push(
        "Complete your professional profile so recommendations can be tailored to you."
      );
    }

    if (skills.length === 0) {
      suggestions.push(
        "Add your technical and professional skills to your SmartHire profile."
      );
    } else {
      suggestions.push(
        `Build a portfolio project that demonstrates ${skills.slice(0, 3).join(", ")}.`
      );

      suggestions.push(
        "Compare your CV with relevant job listings and work on the missing required skills."
      );
    }

    suggestions.push(
      "Use clear, measurable achievements on your CV instead of listing responsibilities alone."
    );

    suggestions.push(
      "Prioritise opportunities whose required skills align with your current experience."
    );

    return res.json({
      agent: "SmartHire AI Career Agent",
      toolUsed: "career_guidance",
      message: `Here are some practical career-development suggestions based on your profile${
        profile?.professionalTitle
          ? ` as ${title}`
          : ""
      }.`,
      data: {
        professionalTitle: profile?.professionalTitle || "",
        currentSkills: skills,
        suggestions,
      },
    });
  } catch (error) {
    console.error("Career Agent error:", error);

    return res.status(500).json({
      error: "The Career Agent couldn't complete that request. Please try again.",
    });
  }
};