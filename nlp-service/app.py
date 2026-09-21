"""
SmartHire NLP Microservice
---------------------------
This service compares a resume against a job description and returns a
similarity score using two techniques:

1. TF-IDF + Cosine Similarity  -> catches exact/near-exact keyword overlap
2. Sentence-BERT + Cosine Similarity -> catches semantic (meaning-based) overlap

The two scores are combined into one final weighted score.
"""

from flask import Flask, request, jsonify
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity as sk_cosine_similarity
from sentence_transformers import SentenceTransformer
import numpy as np
import re

app = Flask(__name__)

# ---------------------------------------------------------------------------
# CONFIG — adjust these weights to tune how much each method contributes
# to the final match score. They must add up to 1.0.
# ---------------------------------------------------------------------------
TFIDF_WEIGHT = 0.4   # keyword-based matching
BERT_WEIGHT = 0.6    # meaning-based matching

# A small, fast pretrained model — good tradeoff for a student project.
# Loaded ONCE at startup (not per-request) because loading is slow.
print("Loading Sentence-BERT model (this may take a moment on first run)...")
bert_model = SentenceTransformer('all-MiniLM-L6-v2')
print("Model loaded. NLP service ready.")

# A minimal stopword list so we don't need to pull in nltk's full corpus.
STOPWORDS = set("""
a an the and or but if while is are was were be been being to of in on at
for with as by from this that these those it its it's i you he she they we
his her their our your not no do does did doing have has had having will
would shall should may might must can could so than then there here also
""".split())


def preprocess_text(text: str) -> str:
    """
    Cleans raw text before it's vectorized.
    Steps: lowercase -> remove punctuation/numbers -> remove stopwords.
    Returns a single cleaned string (TfidfVectorizer expects strings, not lists).
    """
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r'[^a-z\s]', ' ', text)          # strip punctuation & numbers
    tokens = text.split()
    tokens = [t for t in tokens if t not in STOPWORDS and len(t) > 1]
    return " ".join(tokens)


def get_tfidf_score(resume_text: str, job_text: str) -> float:
    """
    Converts both documents into TF-IDF vectors and measures how similar
    they are using cosine similarity. This is a KEYWORD-based comparison —
    it rewards documents that share specific, distinctive words.
    """
    resume_clean = preprocess_text(resume_text)
    job_clean = preprocess_text(job_text)

    if not resume_clean or not job_clean:
        return 0.0

    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform([resume_clean, job_clean])
    score = sk_cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
    return float(score)


def get_bert_score(resume_text: str, job_text: str) -> float:
    """
    Converts both documents into dense semantic vectors (embeddings) using
    a pretrained Sentence-BERT model, then measures cosine similarity.
    This is a MEANING-based comparison — it can match "backend developer"
    with "software engineer" even though they share no exact words.
    """
    if not resume_text or not job_text:
        return 0.0

    embeddings = bert_model.encode([resume_text, job_text])
    score = sk_cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
    return float(score)


def get_final_score(tfidf_score: float, bert_score: float) -> float:
    """
    Combines the two scores into one final match score using a weighted
    average. BERT is weighted higher because semantic matching is generally
    more meaningful for job/resume matching than raw keyword overlap.
    """
    final = (TFIDF_WEIGHT * tfidf_score) + (BERT_WEIGHT * bert_score)
    return round(float(final), 4)


@app.route("/health", methods=["GET"])
def health():
    """Simple endpoint to confirm the service is up and the model is loaded."""
    return jsonify({"status": "ok"}), 200


@app.route("/match", methods=["POST"])
def match():
    """
    Main matching endpoint.

    Expects JSON: { "resumeText": "...", "jobText": "..." }
    Returns JSON: { "tfidfScore": float, "bertScore": float, "finalScore": float }
    """
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    resume_text = data.get("resumeText", "").strip()
    job_text = data.get("jobText", "").strip()

    if not resume_text or not job_text:
        return jsonify({"error": "Both 'resumeText' and 'jobText' are required"}), 400

    tfidf_score = get_tfidf_score(resume_text, job_text)
    bert_score = get_bert_score(resume_text, job_text)
    final_score = get_final_score(tfidf_score, bert_score)

    return jsonify({
        "tfidfScore": round(tfidf_score, 4),
        "bertScore": round(bert_score, 4),
        "finalScore": final_score
    }), 200


if __name__ == "__main__":
    # debug=True is fine for development/demo; turn off for production
    app.run(host="0.0.0.0", port=5001, debug=True)
