import { readFileSync, writeFileSync } from "fs";
import { promises as fsp } from "fs";
import { join, resolve } from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { glob } from "glob";

dotenv.config();

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY ?? "" });

const FRONTEND_ROOT = resolve(process.cwd(), "..", "frontend");
// For React, source lives directly under `src`, not `src/app`
const SOURCE_DIR = join(FRONTEND_ROOT, "src");
const OUTPUT_DIR = join(process.cwd(), "data");
const OUTPUT_PATH = join(OUTPUT_DIR, "embeddings.json");

function chunkText(text, maxChars = 1500) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + maxChars));
    i += maxChars;
  }
  return chunks;
}

async function ensureDir(dir) {
  try {
    await fsp.mkdir(dir, { recursive: true });
  } catch (_) {}
}

async function main() {
  // Index common React and styling extensions
  const files = await glob("**/*.{ts,tsx,js,jsx,html,css,scss}", {
    cwd: SOURCE_DIR,
    nodir: true,
    absolute: true,
  });
  const items = [];
  for (const file of files) {
    const rel = file
      .replace(FRONTEND_ROOT + "\\", "")
      .replace(FRONTEND_ROOT + "/", "");
    const content = readFileSync(file, "utf-8");
    const chunks = chunkText(content);
    for (const chunk of chunks) {
      const emb = await genAI.models.embedContent({
        model: "text-embedding-004",
        contents: [chunk],
      });
      const values = emb.embeddings?.[0]?.values ?? [];
      items.push({ file: rel, text: chunk, embedding: values });
    }
  }
  await ensureDir(OUTPUT_DIR);
  writeFileSync(OUTPUT_PATH, JSON.stringify(items, null, 2));
  console.log(`Wrote ${items.length} embeddings to ${OUTPUT_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
