from flask import Flask, request, jsonify
from fastembed import TextEmbedding
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
import os

app = Flask(__name__)

# Load the semantic AI model once when the service starts.
model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")


# Standardize alternative skill names across multiple industries.
SKILL_ALIASES = {
    # TECHNOLOGY
    "js": "javascript",
    "javascript": "javascript",
    "ecmascript": "javascript",
    "es6": "javascript",
    "es2015": "javascript",
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
    "express": "express",
    "mongodb": "mongodb",
    "mongo db": "mongodb",
    "postgres": "postgresql",
    "postgresql": "postgresql",
    "py": "python",
    "python": "python",
    "ts": "typescript",
    "typescript": "typescript",
    "html5": "html",
    "html": "html",
    "css3": "css",
    "css": "css",
    "ml": "machine learning",
    "machine-learning": "machine learning",
    "nlp": "natural language processing",
    "natural-language-processing": "natural language processing",
    "aws": "aws",
    "amazon web services": "aws",
    "rest api": "rest api",
    "restful api": "rest api",
    "rest apis": "rest api",
    "rest endpoint": "rest api",
    "rest endpoints": "rest api",
    "rest api integration": "rest api",
    "restful endpoints": "rest api",
    "fastapi": "fastapi",
    "fast api": "fastapi",
    "scikit-learn": "scikit-learn",
    "scikit learn": "scikit-learn",
    "sklearn": "scikit-learn",
    "tensorflow": "tensorflow",
    "pytorch": "pytorch",
    "flask": "flask",
    "django": "django",
    "docker": "docker",
    "k8s": "kubernetes",
    "kubernetes": "kubernetes",
    "c plus plus": "c++",
    "c++": "c++",
    "c sharp": "c#",
    "c#": "c#",
    "git": "git",
    "github": "github",
    "sql": "sql",
    "mysql": "mysql",
    "sqlite": "sqlite",
    "redis": "redis",
    "graphql": "graphql",
    "power bi": "power bi",
    "tableau": "tableau",
    "excel": "microsoft excel",
    "ms excel": "microsoft excel",
    "microsoft excel": "microsoft excel",
    "advanced excel": "microsoft excel",
    "google sheets": "google sheets",
    "google workspace": "google workspace",
    "microsoft word": "microsoft word",
    "ms word": "microsoft word",
    "microsoft powerpoint": "microsoft powerpoint",
    "powerpoint": "microsoft powerpoint",
    "data analysis": "data analysis",
    "data analytics": "data analysis",
    "cybersecurity": "cybersecurity",
    "cyber security": "cybersecurity",
    "network administration": "network administration",
    "ui ux": "ui/ux design",
    "ui/ux": "ui/ux design",
    "graphic design": "graphic design",
    "content writing": "content writing",
    "seo": "search engine optimization",
    "search engine optimization": "search engine optimization",

    # GENERAL BUSINESS AND WORKPLACE SKILLS
    "communication": "communication",
    "verbal communication": "communication",
    "written communication": "communication",
    "interpersonal skills": "interpersonal skills",
    "teamwork": "teamwork",
    "team work": "teamwork",
    "problem solving": "problem solving",
    "problem-solving": "problem solving",
    "time management": "time management",
    "leadership": "leadership",
    "negotiation": "negotiation",
    "sales": "sales",
    "marketing": "marketing",
    "digital marketing": "digital marketing",
    "business development": "business development",
    "project management": "project management",
    "administration": "administration",
    "administrative support": "administration",
    "virtual assistance": "virtual assistance",
    "virtual assistant": "virtual assistance",
    "calendar management": "calendar management",
    "email management": "email management",
    "social media management": "social media management",
    "content creation": "content creation",
    "data entry": "data entry",
    "record keeping": "record keeping",
    "public relations": "public relations",
    "pr": "public relations",
    "customer service": "customer service",
    "customer care": "customer service",
    "customer support": "customer support",
    "complaint resolution": "complaint resolution",
    "call centre": "call centre operations",
    "call center": "call centre operations",
    "call centre operations": "call centre operations",
    "product knowledge": "product knowledge",

    # ACCOUNTING AND FINANCE
    "accounting": "accounting",
    "accountant": "accounting",
    "bookkeeping": "bookkeeping",
    "book keeping": "bookkeeping",
    "financial reporting": "financial reporting",
    "financial analysis": "financial analysis",
    "budgeting": "budgeting",
    "tax preparation": "tax preparation",
    "tax prep": "tax preparation",
    "taxation": "taxation",
    "auditing": "auditing",
    "audit": "auditing",
    "payroll": "payroll",
    "accounts payable": "accounts payable",
    "accounts receivable": "accounts receivable",
    "bank reconciliation": "bank reconciliation",
    "financial management": "financial management",
    "quickbooks": "quickbooks",
    "quick books": "quickbooks",
    "sage accounting": "sage accounting",
    "sage": "sage accounting",
    "invoicing": "invoicing",
    "cash flow management": "cash flow management",

    # HOSPITALITY AND HOTEL MANAGEMENT
    "food preparation": "food preparation",
    "food prep": "food preparation",
    "cooking": "cooking",
    "menu planning": "menu planning",
    "food hygiene": "food hygiene",
    "food safety": "food safety",
    "baking": "baking",
    "table service": "table service",
    "bartending": "bartending",
    "bar service": "bartending",
    "housekeeping": "housekeeping",
    "hotel reservations": "hotel reservations",
    "reservation management": "hotel reservations",
    "booking management": "booking management",
    "front desk operations": "front desk operations",
    "front desk": "front desk operations",
    "guest relations": "guest relations",
    "hospitality management": "hospitality management",
    "event planning": "event planning",
    "laundry": "laundry",
    "hotel management": "hotel management",
    "room service": "room service",
    "catering": "catering",
    "food and beverage service": "food and beverage service",
        # ALTERNATIVE WORDING FOR HOSPITALITY
    "hotel bookings": "hotel reservations",
    "handling hotel bookings": "hotel reservations",
    "managing hotel bookings": "hotel reservations",
    "booking hotel rooms": "hotel reservations",
    "hotel room bookings": "hotel reservations",
    "guest enquiries": "guest relations",
    "guest inquiries": "guest relations",
    "managing guest enquiries": "guest relations",
    "managing guest inquiries": "guest relations",
    "welcoming guests": "guest relations",
    "attending to guests": "guest relations",
    "assisting hotel guests": "guest relations",

    # ALTERNATIVE WORDING FOR COMMUNICATION
    "communicate well": "communication",
    "good communication skills": "communication",
    "excellent communication skills": "communication",
    "effective communication": "communication",
    "communicating effectively": "communication",
    "verbal and written communication": "communication",

    # HEALTHCARE
    "patient care": "patient care",
    "nursing": "nursing",
    "clinical assessment": "clinical assessment",
    "first aid": "first aid",
    "cpr": "cpr",
    "bls": "basic life support",
    "basic life support": "basic life support",
    "vital signs monitoring": "vital signs monitoring",
    "vitals monitoring": "vital signs monitoring",
    "medication administration": "medication administration",
    "wound care": "wound care",
    "infection prevention": "infection prevention",
    "infection control": "infection prevention",
    "medical records": "medical records",
    "laboratory testing": "laboratory testing",
    "phlebotomy": "phlebotomy",
    "pharmacy": "pharmacy",
    "medication dispensing": "medication dispensing",
    "patient communication": "patient communication",
    "public health": "public health",
    "health education": "health education",
    "physiotherapy": "physiotherapy",
    "physical therapy": "physiotherapy",
    "radiography": "radiography",
    "medical laboratory science": "medical laboratory science",
    "patient monitoring": "patient monitoring",

    # EDUCATION
    "teaching": "teaching",
    "lesson planning": "lesson planning",
    "curriculum planning": "curriculum planning",
    "classroom management": "classroom management",
    "student assessment": "student assessment",
    "childcare": "childcare",
    "early childhood education": "early childhood education",
    "special needs education": "special needs education",
    "tutoring": "tutoring",
    "online teaching": "online teaching",
    "educational technology": "educational technology",
    "classroom instruction": "teaching",

    # CONSTRUCTION AND ENGINEERING
    "civil engineering": "civil engineering",
    "structural design": "structural design",
    "autocad": "autocad",
    "building design": "building design",
    "construction planning": "construction planning",
    "site supervision": "site supervision",
    "project estimation": "project estimation",
    "quantity surveying": "quantity surveying",
    "electrical installation": "electrical installation",
    "electrical wiring": "electrical installation",
    "plumbing": "plumbing",
    "carpentry": "carpentry",
    "masonry": "masonry",
    "welding": "welding",
    "equipment maintenance": "equipment maintenance",
    "workplace safety": "workplace safety",
    "health and safety": "workplace safety",
    "mechanical engineering": "mechanical engineering",
    "electrical engineering": "electrical engineering",
    "maintenance": "maintenance",
    "hvac": "hvac",

    # TRANSPORT AND LOGISTICS
    "driving": "driving",
    "safe driving": "defensive driving",
    "defensive driving": "defensive driving",
    "commercial driving": "commercial driving",
    "route planning": "route planning",
    "vehicle maintenance": "vehicle maintenance",
    "fleet management": "fleet management",
    "logistics": "logistics",
    "supply chain": "supply chain management",
    "supply chain management": "supply chain management",
    "warehouse management": "warehouse management",
    "warehousing": "warehouse management",
    "inventory management": "inventory management",
    "inventory control": "inventory management",
    "dispatch operations": "dispatch operations",
    "delivery operations": "delivery operations",
    "forklift operation": "forklift operation",
    "stock control": "inventory management",

    # RETAIL AND SECURITY
    "retail sales": "retail sales",
    "merchandising": "merchandising",
    "cash handling": "cash handling",
    "pos": "point of sale operations",
    "point of sale": "point of sale operations",
    "point of sale operations": "point of sale operations",
    "security operations": "security operations",
    "surveillance": "surveillance",
    "access control": "access control",
    "risk assessment": "risk assessment",
    "emergency response": "emergency response",
    "quality control": "quality control",
    "quality assurance": "quality assurance",
    "procurement": "procurement",
    "purchasing": "procurement",
    "manufacturing": "manufacturing",
    "production planning": "production planning",
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
    """Calculate semantic similarity using the FastEmbed ONNX model."""
    embeddings = list(model.embed([resume_text, job_text]))

    score = cosine_similarity(
        embeddings[0].reshape(1, -1),
        embeddings[1].reshape(1, -1)
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
    """Extract skills from job-description headings or known aliases."""
    heading_pattern = (
        r"(?im)^[ \t]*"
        r"(?:required\s+skills|technical\s+skills|"
        r"skills\s+required|key\s+skills|skills)"
        r"[ \t]*:?[ \t]*"
    )

    heading_match = re.search(heading_pattern, job_text)

    if not heading_match:
        heading_match = re.search(
            r"(?i)\b(?:required\s+skills|technical\s+skills|"
            r"skills\s+required|key\s+skills|skills)\s*:",
            job_text
        )

    if not heading_match:
        normalized_job = normalize_text(job_text)
        occurrences = []

        for alias in sorted(SKILL_ALIASES, key=len, reverse=True):
            pattern = (
                r"(?<![a-z0-9])"
                + re.escape(alias)
                + r"(?![a-z0-9])"
            )

            for match in re.finditer(pattern, normalized_job):
                occurrences.append((
                    match.start(),
                    -len(alias),
                    SKILL_ALIASES[alias]
                ))

        occurrences.sort()

        detected_skills = []
        seen_skills = set()

        for _, _, skill in occurrences:
            if skill not in seen_skills:
                detected_skills.append(skill)
                seen_skills.add(skill)

        return detected_skills

    skills_text = job_text[heading_match.end():]

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

    skills_text = re.sub(r"[•●▪✓]", ",", skills_text)
    skills_text = re.sub(r"(?m)^\s*[-*]\s*", "", skills_text)

    candidates = re.split(r"[,;\n|]+", skills_text)

    unique_skills = []
    seen = set()

    for candidate in candidates:
        skill = candidate.strip(" \t\r\n:-")

        skill = re.sub(
            r"^(?:(?:and|or)\s+)+",
            "",
            skill,
            flags=re.IGNORECASE
        ).strip()

        if not skill:
            continue

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
        semantic_score = calculate_semantic_score(
            resume_text,
            job_text
        )

        tfidf_score = calculate_tfidf_score(
            resume_text,
            job_text
        )

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

        skill_score = calculate_skill_score(
            resume_text,
            required_skills
        )

        # Overall match formula:
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