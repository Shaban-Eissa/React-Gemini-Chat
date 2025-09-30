## AI React Code Chat

An AI‑powered code assistant for your React projects. Ask natural‑language questions about your own codebase; the app retrieves the most relevant code snippets (RAG) and lets Gemini answer with your context.

- Frontend: React + Vite (Tailwind utility classes used in UI)
- Backend: Node.js (Express) + Gemini (Google AI) for embeddings and generation
- Ingestion: one‑time script that embeds your React source into `embeddings.json`

### Why this project

Development teams need fast, trustworthy answers that reflect their code, not generic docs. This app:

- Indexes your React app into small chunks
- Computes semantic vectors (embeddings) for each chunk
- On each question, finds the most relevant chunks and sends them as context to Gemini
- Returns an answer grounded in your codebase

This is Retrieval‑Augmented Generation (RAG) for React.


## Architecture Overview

1) Ingestion 
- Reads `frontend/src/**` for `.ts/.tsx/.js/.jsx/.html/.css/.scss`
- Splits files into chunks
- Calls Gemini `text-embedding-004` for each chunk → numeric vector
- Writes `backend/data/embeddings.json` with `{ file, text, embedding }`

2) Backend 
- `/ask` receives `{ question }`
- Embeds the question using `text-embedding-004`
- Cosine similarity vs. stored chunk vectors → pick top K (3)
- Sends question + top chunks to `gemini-2.5-flash`
- Returns `{ answer }`

3) Frontend
- Renders chat UI, sends questions to `/ask`, displays answers


## Prerequisites

- Node 18+
- A Google AI Studio API key (`GOOGLE_API_KEY`) from `https://aistudio.google.com/app/api-keys`


## Setup

### Frontend (React + Vite)
1. Go to the frontend project
```
cd frontend
```
2. Install dependencies
```
npm install
```
3. Configure the backend URL for local dev (optional if you use a Vite proxy)
   - Create `.env` (or `.env.local`) in `frontend/`:
```
VITE_BACKEND_URL=http://localhost:3000
```
4. Start the dev server
```
npm run dev
```
The app is available at `http://localhost:5173`.

### Backend (Gemini)
1. Go to the backend project
```
cd backend
```
2. Install dependencies
```
npm install
```
3. Create `.env`
```
GOOGLE_API_KEY=your-gemini-api-key
PORT=3000
```
4. Ingest your React source (build the RAG corpus)
```
npm run ingest
```
This creates/updates `data/embeddings.json`. Rerun ingestion whenever your code changes.

5. Start the API server
```
npm start
```
The endpoint is `http://localhost:3000/ask`. The embeddings file is served at `http://localhost:3000/data/embeddings.json`.



## How the RAG flow works

- Embeddings: numeric vectors that represent meaning. Similar text → similar vectors.
- Corpus: all your chunks + their vectors loaded from `data/embeddings.json`.
- Retrieval: embed the user question, compute cosine similarity with each chunk, pick top‑K.
- Generation: pass question + top‑K chunks to Gemini for a grounded answer.

Default parameters
- Embedding model: `text-embedding-004`
- Generation model: `gemini-2.5-flash`
- Top‑K: 3
