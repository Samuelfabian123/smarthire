# SmartHire

AI-powered job and resume matching system — MERN stack + Python/Flask NLP microservice.

## Project Structure

```
smarthire/
├── client/          React frontend (Vite + Tailwind)
├── server/          Node.js + Express backend (MongoDB via Mongoose)
└── nlp-service/     Python + Flask NLP microservice (TF-IDF + Sentence-BERT)
```

## How matching works

1. Text is preprocessed (lowercased, punctuation stripped, stopwords removed).
2. **TF-IDF** turns the resume and job description into keyword vectors and
   compares them with cosine similarity — rewards exact/near-exact keyword overlap.
3. **Sentence-BERT** turns them into semantic embeddings and compares those —
   rewards meaning-based overlap even with different wording.
4. The two scores are combined into a weighted final score
   (default: 40% TF-IDF, 60% BERT — adjustable in `nlp-service/app.py`).

## Setup

### 1. NLP microservice (start this first)

```bash
cd nlp-service
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Runs on `http://localhost:5001`. First run downloads the Sentence-BERT model
(~80MB) — needs internet access once.

Test it:
```bash
curl http://localhost:5001/health

curl -X POST http://localhost:5001/match \
  -H "Content-Type: application/json" \
  -d '{"resumeText": "Backend developer skilled in Node.js and MongoDB", "jobText": "Looking for a software engineer experienced in server-side JavaScript"}'
```

### 2. Backend (Express + MongoDB)

```bash
cd server
npm install
cp .env.example .env
# edit .env: set MONGO_URI (MongoDB Atlas connection string) and JWT_SECRET
npm run dev
```

Runs on `http://localhost:5000`.

### 3. Frontend (React)

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Runs on `http://localhost:5173`.

## Environment variables

**server/.env**
- `MONGO_URI` — MongoDB Atlas connection string
- `JWT_SECRET` — any long random string
- `NLP_SERVICE_URL` — default `http://localhost:5001`
- `CLIENT_URL` — default `http://localhost:5173`

**client/.env**
- `VITE_API_URL` — default `http://localhost:5000/api`

## Typical demo flow

1. Register as an Employer → post a job.
2. Register as a Job Seeker (separate browser/incognito) → upload resume (PDF/DOCX) → browse jobs → "Check Match" to get a score.
3. Log back in as the Employer → open the job → "View Candidates" to see the ranked list.

## Deployment notes

- **Frontend:** Vercel or GitHub Pages
- **Backend:** Render
- **NLP service:** Render (separate service — needs more memory for the BERT model)
- **Database:** MongoDB Atlas
