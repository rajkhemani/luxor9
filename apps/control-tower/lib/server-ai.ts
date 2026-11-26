import { GoogleGenAI } from "@google/genai";

let cachedClient: GoogleGenAI | null = null;
let cachedKey: string | undefined;

export function getServerGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Voice AI API key is not configured on the server. Add GEMINI_API_KEY in Settings > Secrets.",
    );
  }
  if (!cachedClient || cachedKey !== apiKey) {
    cachedClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    cachedKey = apiKey;
  }
  return cachedClient;
}
