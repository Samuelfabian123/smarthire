from flask import Flask, request, jsonify
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)


def calculate_tfidf_score(resume_text, job_text):
    vectorizer = TfidfVectorizer(stop_words="english")

    vectors = vectorizer.fit_transform([
        resume_text,
        job_text
    ])

    score = cosine_similarity(
        vectors[0:1],
        vectors[1:2]
    )[0][0]

    return float(score)


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
        tfidf_score = calculate_tfidf_score(
            resume_text,
            job_text
        )

        return jsonify({
            "tfidfScore": round(tfidf_score, 4),
            "bertScore": round(tfidf_score, 4),
            "finalScore": round(tfidf_score, 4)
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