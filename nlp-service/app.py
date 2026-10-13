from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
import os

app = Flask(__name__)

# Load the AI model once when the service starts.
model = SentenceTransformer("all-MiniLM-L6-v2")


def normalize_text(text):
    """Normalize text for reliable skill matching."""
    text = str(text or "").lower()
    text = re.sub(r"[^a-z0-9+#.\s-]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def calculate_semantic_score(resume_text, job_text):
    """Calculate semantic similarity between a CV and a job."""
    embeddings = model.encode(
        [resume_text, job_text],
        convert_to_numpy=True
    )

    score = cosine_similarity(
        [embeddings[0]], [embeddings[1]]
    )[0][0]

    return max(0.0, min(1.0, float(score)))


def calculate_tfidf_score(resume_text, job_text):
    """Calculate lexical similarity using TF-IDF."""
    try:
        vectorizer = TfidfVectorizer(stop_words="english")
        vectors = vectorizer.fit_transform(
            [resume_text, job_text]
        )
        score = cosine_similarity(
            vectors[0:1], vectors[1:2]
        )[0][0]

        return max(0.0, min(1.0, float(score)))
    except ValueError:
        return 0.0


def skill_is_present(resume_text, skill):
    """Check whether a required skill appears in the CV."""
    resume_normalized = normalize_text(resume_text)
    skill_normalized = normalize_text(skill)

    if not skill_normalized:
        return False

    pattern = (
        r"(?<!\w)"
        + re.escape(skill_normalized)
        + r"(?!\w)"
    )

    return re.search(pattern, resume_normalized) is not None


def extract_required_skills(job_text):
    """Extract the Required Skills section from the job text."""
    marker = "Required Skills:"

    parts = re.split(
        re.escape(marker),
        job_text,
        maxsplit=1,
        flags=re.IGNORECASE
    )

    if len(parts) < 2:
        return []

    skills = [
        skill.strip()
        for skill in parts[1].strip().split(",")
        if skill.strip()
    ]

    unique_skills = []
    seen = set()

    for skill in skills:
        key = normalize_text(skill)

        if key and key not in seen:
            unique_skills.append(skill)
            seen.add(key)

    return unique_skills


def calculate_skill_score(resume_text, required_skills):
    """Calculate the proportion of required skills found."""
    if not required_skills:
        return 0.0

    matched_count = sum(
        1 for skill in required_skills
        if skill_is_present(resume_text, skill)
    )

    return matched_count / len(required_skills)


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/match")
def match():
    data = request.get_json(silent=True) or {}

    resume_text = str(data.get("resumeText") or "").strip()
    job_text = str(data.get("jobText") or "").strip()

    if not resume_text or not job_text:
        return jsonify({
            "error": "resumeText and jobText are required"
        }), 400

    try:
        # 1. Calculate semantic and keyword similarity.
        semantic_score = calculate_semantic_score(
            resume_text, job_text
        )

        tfidf_score = calculate_tfidf_score(
            resume_text, job_text
        )

        # 2. Identify required, matched, and missing skills.
        required_skills = extract_required_skills(job_text)

        matched_skills = [
            skill for skill in required_skills
            if skill_is_present(resume_text, skill)
        ]

        matched_normalized = {
            normalize_text(skill)
            for skill in matched_skills
        }

        missing_skills = [
            skill for skill in required_skills
            if normalize_text(skill) not in matched_normalized
        ]

        # 3. Calculate required-skill coverage.
        skill_score = calculate_skill_score(
            resume_text, required_skills
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
            0.0, min(1.0, float(final_score))
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