import { NextRequest, NextResponse } from "next/server";
import { getServerGenAI } from "@/lib/server-ai";

const MAX_AUDIO_BASE64_BYTES = 12 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  try {
    const body = (await req.json().catch(() => null)) as {
      audioBase64?: unknown;
      mimeType?: unknown;
    } | null;

    if (!body || typeof body.audioBase64 !== "string" || !body.audioBase64.trim()) {
      return NextResponse.json(
        { error: "Audio payload (audioBase64) is required." },
        { status: 400 },
      );
    }

    if (body.audioBase64.length > MAX_AUDIO_BASE64_BYTES) {
      return NextResponse.json(
        { error: "Audio clip exceeds maximum size limit." },
        { status: 413 },
      );
    }

    const mimeType =
      typeof body.mimeType === "string" && body.mimeType.startsWith("audio/")
        ? body.mimeType
        : "audio/wav";

    const ai = getServerGenAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-transcribe",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: body.audioBase64,
            },
          },
          {
            text: "Transcribe the spoken speech verbatim. Return only the transcript text with no commentary. If only silence or background noise is heard, return an empty string.",
          },
        ],
      },
    });

    const transcript = (response.text ?? "").trim();
    return NextResponse.json({
      transcript,
      latencyMs: Date.now() - startedAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Audio transcription failed.";
    const status = message.includes("API key is not configured") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
