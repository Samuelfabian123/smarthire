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

Runs on `http://localhost:5001` locally. First run downloads the Sentence-BERT model
and its supporting libraries, so allow time and memory for the first startup. For production, use
Gunicorn rather than Flask's development server:
```bash
gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120
```
The service reads the hosting platform's `PORT` variable (and defaults to 5001 locally).

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

- **Frontend:** Vercel or Render Static Site
- **Backend:** Render Web Service (root directory: `server`; build: `npm install`; start: `npm start`)
- **NLP service:** a separate Render Web Service (root directory: `nlp-service`; build: `pip install -r requirements.txt`; start: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120`)
- **Database:** MongoDB Atlas

After deploying the NLP service, set the backend's `NLP_SERVICE_URL` environment variable to that service's public base URL (for example, `https://your-nlp-service.onrender.com`, without `/match`). Do not use `localhost:5001` in the deployed backend. Set `CLIENT_URL` to the exact frontend origin (for example, the Vercel or Render frontend URL); multiple origins can be comma-separated. Set the frontend's `VITE_API_URL` to the backend URL ending in `/api`.

Render can take a while to download/load the embedding model on first start, and the Sentence-Transformer model uses significant memory. Confirm that the selected service instance has enough memory and that `/health` responds before testing matching.
