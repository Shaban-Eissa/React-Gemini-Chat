import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
// Allow Vite dev server origin by default
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
// Serve embeddings statically for the frontend
app.use("/data", express.static(join(process.cwd(), "data")));

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY ?? "" });
const embeddingsPath = join(process.cwd(), "data", "embeddings.json");

let corpus = [];
try {
  const raw = readFileSync(embeddingsPath, "utf-8");
  corpus = JSON.parse(raw);
} catch (_) {
  corpus = [];
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let an = 0;
  let bn = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    an += a[i] * a[i];
    bn += b[i] * b[i];
  }
  if (an === 0 || bn === 0) return 0;
  return dot / (Math.sqrt(an) * Math.sqrt(bn));
}

app.post("/ask", async (req, res) => {
  try {
    const question = String(req.body?.question ?? "").trim();
    if (!question)
      return res.status(400).json({ answer: "Question is required." });

    const embedResp = await genAI.models.embedContent({
      model: "text-embedding-004",
      contents: [question],
    });
    const queryVector = embedResp.embeddings?.[0]?.values ?? [];

    const ranked = corpus
      .map((c) => ({ ...c, score: cosineSimilarity(queryVector, c.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const context = ranked
      .map((r, i) => `Chunk ${i + 1} (${r.file}):\n${r.text}`)
      .join("\n\n");

    const prompt = `You are a helpful assistant answering questions about a React codebase.\n\nContext (top snippets):\n${context}\n\nQuestion: ${question}\n\nAnswer clearly and cite file names where helpful.`;
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const answer = response.text ?? "No answer.";
    res.json({ answer });
  } catch (err) {
    res.status(500).json({ answer: "Server error." });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
