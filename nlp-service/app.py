from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import re

app = Flask(__name__)

# Semantic language model used to understand the meaning
# of resumes and job descriptions.
model = SentenceTransformer("all-MiniLM-L6-v2")


def calculate_semantic_score(resume_text, job_text):
    embeddings = model.encode(
        [resume_text, job_text],
        convert_to_numpy=True
    )

    score = cosine_similarity(
        [embeddings[0]],
        [embeddings[1]]
    )[0][0]

    # Keep score between 0 and 1
    score = max(0.0, min(1.0, float(score)))

    return score


def normalize_text(text):
    """
    Converts text to lowercase and removes unnecessary
    punctuation so skill matching is more reliable.
    """
    text = text.lower()
    text = re.sub(r"[^a-z0-9+#.\s-]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def skill_is_present(resume_text, skill):
    """
    Checks whether a required skill appears in the resume
    as a complete word or phrase.
    """

    resume_normalized = normalize_text(resume_text)
    skill_normalized = normalize_text(skill)

    if not skill_normalized:
        return False

    pattern = r"(?<!\w)" + re.escape(skill_normalized) + r"(?!\w)"

    return re.search(pattern, resume_normalized) is not None


def calculate_skill_score(resume_text, required_skills):
    """
    Calculates how many of the employer's required skills
    are present in the candidate's resume.
    """

    if not required_skills:
        return 0.0

    matched_skills = 0

    for skill in required_skills:
        if skill_is_present(resume_text, skill):
            matched_skills += 1

    return matched_skills / len(required_skills)


def extract_required_skills(job_text):
    """
    Extracts the Required Skills section from the job text.
    """

    marker = "Required Skills:"

    if marker not in job_text:
        return []

    skills_section = job_text.split(marker, 1)[1].strip()

    if not skills_section:
        return []

    skills = [
        skill.strip()
        for skill in skills_section.split(",")
        if skill.strip()
    ]

    return skills


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/match")
def match():
    data = request.get_json(silent=True) or {}

    resume_text = data.get("resumeText", "").strip()
    job_text = data.get("jobText", "").strip()

    if not resume_text or not job_text:
        return jsonify({
            "error": "resumeText and jobText are required"
        }), 400

    try:
        # ---------------------------------------------
        # 1. Semantic AI understanding
        # ---------------------------------------------
        semantic_score = calculate_semantic_score(
            resume_text,
            job_text
        )

        # ---------------------------------------------
        # 2. Employer-specific skill matching
        # ---------------------------------------------
        required_skills = extract_required_skills(job_text)

        skill_score = calculate_skill_score(
            resume_text,
            required_skills
        )

        # ---------------------------------------------
        # 3. Final SmartHire score
        #
        # 60% semantic understanding
        # 40% required skill matching
        # ---------------------------------------------
        final_score = (
            (semantic_score * 0.60) +
            (skill_score * 0.40)
        )

        final_score = max(
            0.0,
            min(1.0, float(final_score))
        )

        # ---------------------------------------------
        # 4. Find the actual matched skills
        # ---------------------------------------------
        matched_skills = [
            skill
            for skill in required_skills
            if skill_is_present(resume_text, skill)
        ]

        return jsonify({
            "tfidfScore": round(semantic_score, 4),
            "bertScore": round(semantic_score, 4),
            "skillScore": round(skill_score, 4),
            "finalScore": round(final_score, 4),
            "matchedSkills": matched_skills,
            "requiredSkills": required_skills
        })

    except Exception as error:
        return jsonify({
            "error": "Matching failed",
            "details": str(error)
        }), 500


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5001,
        debug=False
    )