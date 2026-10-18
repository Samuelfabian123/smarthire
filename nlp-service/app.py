from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
import os

app = Flask(__name__)

# Load the semantic AI model once when the service starts.
model = SentenceTransformer("all-MiniLM-L6-v2")


# Standardize common alternative names for technical skills.
SKILL_ALIASES = {
    "js": "javascript",
    "javascript": "javascript",
    "node": "node.js",
    "nodejs": "node.js",
    "node.js": "node.js",
    "reactjs": "react",
    "react.js": "react",
    "react": "react",
    "nextjs": "next.js",
    "next.js": "next.js",
    "expressjs": "express",
    "express.js": "express",
    "mongodb": "mongodb",
    "mongo db": "mongodb",
    "postgres": "postgresql",
    "postgresql": "postgresql",
    "py": "python",
    "python": "python",
    "ts": "typescript",
    "typescript": "typescript",
    "html5": "html",
    "css3": "css",
    "ml": "machine learning",
    "machine-learning": "machine learning",
    "nlp": "natural language processing",
    "natural-language-processing": "natural language processing",
    "aws": "aws",
    "amazon web services": "aws",
    "rest api": "rest api",
    "restful api": "rest api",
    "rest apis": "rest api",
    "flask": "flask",
    "django": "django",
    "docker": "docker",
    "k8s": "kubernetes",
    "kubernetes": "kubernetes",
    "c plus plus": "c++",
    "c++": "c++",
    "c sharp": "c#",
    "c#": "c#",
}


def normalize_text(text):
    """Normalize text while preserving programming-language symbols."""
    text = str(text or "").lower()
    text = text.replace("&", " and ")
    text = re.sub(r"[^a-z0-9+#.\s/-]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def canonical_skill(skill):
    """Convert a known skill alias into its standard name."""
    normalized = normalize_text(skill)

    for alias in sorted(SKILL_ALIASES, key=len, reverse=True):
        pattern = (
            r"(?<![a-z0-9])"
            + re.escape(alias)
            + r"(?![a-z0-9])"
        )

        if re.search(pattern, normalized):
            return SKILL_ALIASES[alias]

    return normalized


def skill_is_present(resume_text, skill):
    """Match skills using word boundaries and common aliases."""
    resume_normalized = normalize_text(resume_text)
    skill_normalized = normalize_text(skill)

    if not resume_normalized or not skill_normalized:
        return False

    canonical = canonical_skill(skill)

    aliases = [
        alias
        for alias, standard in SKILL_ALIASES.items()
        if standard == canonical
    ]

    aliases.extend([skill_normalized, canonical])

    for alias in set(aliases):
        alias_normalized = normalize_text(alias)

        if not alias_normalized:
            continue

        pattern = (
            r"(?<![a-z0-9])"
            + re.escape(alias_normalized)
            + r"(?![a-z0-9])"
        )

        if re.search(pattern, resume_normalized):
            return True

    return False


def calculate_semantic_score(resume_text, job_text):
    """Calculate semantic similarity between a CV and a job."""
    embeddings = model.encode(
        [resume_text, job_text],
        convert_to_numpy=True,
        normalize_embeddings=True
    )

    score = cosine_similarity(
        embeddings[0:1],
        embeddings[1:2]
    )[0][0]

    return max(0.0, min(1.0, float(score)))


def calculate_tfidf_score(resume_text, job_text):
    """Calculate lexical similarity using words and short phrases."""
    try:
        vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            sublinear_tf=True
        )

        vectors = vectorizer.fit_transform(
            [resume_text, job_text]
        )

        score = cosine_similarity(
            vectors[0:1],
            vectors[1:2]
        )[0][0]

        return max(0.0, min(1.0, float(score)))

    except ValueError:
        return 0.0


def extract_required_skills(job_text):
    """Extract skills from common job-description headings."""
    heading_pattern = (
        r"(?im)^[ \t]*"
        r"(?:required\s+skills|technical\s+skills|"
        r"skills\s+required|key\s+skills|skills)"
        r"[ \t]*:?[ \t]*"
    )

    heading_match = re.search(heading_pattern, job_text)

    # Also support headings appearing after other text on a line.
    if not heading_match:
        heading_match = re.search(
            r"(?i)\b(?:required\s+skills|technical\s+skills|"
            r"skills\s+required|key\s+skills|skills)\s*:",
            job_text
        )

    if not heading_match:
        return []

    skills_text = job_text[heading_match.end():]

    # Stop extracting when another recognizable section begins.
    next_heading = re.search(
        r"(?im)^[ \t]*(?:"
        r"responsibilities|job\s+responsibilities|"
        r"qualifications|requirements|"
        r"preferred\s+qualifications|"
        r"benefits|about\s+the\s+company|"
        r"experience|education|description"
        r")[ \t]*:",
        skills_text
    )

    if next_heading:
        skills_text = skills_text[:next_heading.start()]

    # Support bullet lists and common separators.
    skills_text = re.sub(r"[•●▪✓]", ",", skills_text)
    skills_text = re.sub(r"(?m)^\s*[-*]\s*", "", skills_text)

    candidates = re.split(r"[,;\n|]+", skills_text)

    unique_skills = []
    seen = set()

    for candidate in candidates:
        skill = candidate.strip(" \t\r\n:-")

        if not skill:
            continue

        # Ignore long sentences that are unlikely to be individual skills.
        if len(skill) > 60 or len(skill.split()) > 7:
            continue

        key = canonical_skill(skill)

        if key and key not in seen:
            unique_skills.append(skill)
            seen.add(key)

    return unique_skills


def calculate_skill_score(resume_text, required_skills):
    """Calculate the proportion of required skills found in the CV."""
    if not required_skills:
        return 0.0

    matched_count = sum(
        1
        for skill in required_skills
        if skill_is_present(resume_text, skill)
    )

    return matched_count / len(required_skills)


@app.get("/health")
def health():
    return jsonify({"status": "ok"}), 200


@app.post("/match")
def match():
    data = request.get_json(silent=True) or {}

    resume_text = str(data.get("resumeText") or "").strip()
    job_text = str(data.get("jobText") or "").strip()

    if not resume_text or not job_text:
        return jsonify({
            "error": "resumeText and jobText are required"
        }), 400

    if len(resume_text) < 20 or len(job_text) < 20:
        return jsonify({
            "error": "Resume and job description must contain more text"
        }), 400

    try:
        # 1. Calculate semantic and lexical similarity.
        semantic_score = calculate_semantic_score(
            resume_text,
            job_text
        )

        tfidf_score = calculate_tfidf_score(
            resume_text,
            job_text
        )

        # 2. Extract and compare required skills.
        required_skills = extract_required_skills(job_text)

        matched_skills = [
            skill
            for skill in required_skills
            if skill_is_present(resume_text, skill)
        ]

        matched_keys = {
            canonical_skill(skill)
            for skill in matched_skills
        }

        missing_skills = [
            skill
            for skill in required_skills
            if canonical_skill(skill) not in matched_keys
        ]

        # 3. Calculate required-skill coverage.
        skill_score = calculate_skill_score(
            resume_text,
            required_skills
        )

        # 4. Calculate overall compatibility.
        # TF-IDF: 20%, semantic similarity: 40%,
        # required-skill coverage: 40%.
        final_score = (
            tfidf_score * 0.20
            + semantic_score * 0.40
            + skill_score * 0.40
        )

        final_score = max(
            0.0,
            min(1.0, float(final_score))
        )

        return jsonify({
            "tfidfScore": round(tfidf_score, 4),
            "bertScore": round(semantic_score, 4),
            "skillScore": round(skill_score, 4),
            "finalScore": round(final_score, 4),
            "matchedSkills": matched_skills,
            "requiredSkills": required_skills,
            "missingSkills": missing_skills
        }), 200

    except Exception as error:
        app.logger.exception("CV matching failed")

        return jsonify({
            "error": "Matching failed",
            "details": str(error)
        }), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )