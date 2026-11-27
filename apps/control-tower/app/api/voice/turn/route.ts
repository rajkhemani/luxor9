import { NextRequest } from "next/server";
import { ThinkingLevel } from "@google/genai";
import { requireUserOrUnauthorized } from "@/lib/require-user";
import { getServerGenAI } from "@/lib/server-ai";
import {
  extractSpeakableSentences,
  VOICE_PERSONAS,
  type VoiceProfileId,
  type VoiceToneName,
} from "@/lib/voice-vad";

const ALLOWED_VOICES = new Set<VoiceToneName>([
  "Charon",
  "Kore",
  "Fenrir",
  "Puck",
  "Zephyr",
]);

type TurnMessageInput = {
  role: "user" | "assistant" | "system";
  text: string;
};

type TurnRequestBody = {
  messages?: TurnMessageInput[];
  systemPrompt?: string;
  voiceName?: string;
  profile?: VoiceProfileId;
  bargeInContext?: string | null;
  enableAudio?: boolean;
};

function encodeSse(event: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`);
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now();
  const unauthorized = await requireUserOrUnauthorized();
  if (unauthorized) return unauthorized;
  let body: TurnRequestBody;
  try {
    body = (await req.json()) as TurnRequestBody;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON payload." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return new Response(JSON.stringify({ error: "At least one turn message is required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let ai;
  try {
    ai = getServerGenAI();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Voice engine unavailable.";
    return new Response(JSON.stringify({ error: message }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const voiceName: VoiceToneName =
    body.voiceName && ALLOWED_VOICES.has(body.voiceName as VoiceToneName)
      ? (body.voiceName as VoiceToneName)
      : "Charon";

  const profile: VoiceProfileId = body.profile === "balanced" ? "balanced" : "ultra_low";
  const enableAudio = body.enableAudio !== false;

  const baseSystemPrompt =
    typeof body.systemPrompt === "string" && body.systemPrompt.trim()
      ? body.systemPrompt.trim()
      : VOICE_PERSONAS.trace_galaxy_founder.systemPrompt;

  const fullSystemInstruction = body.bargeInContext
    ? `${baseSystemPrompt}\n\n${body.bargeInContext}`
    : baseSystemPrompt;

  const contents = messages
    .filter((m) => typeof m.text === "string" && m.text.trim().length > 0)
    .slice(-16)
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [
        {
          text:
            m.role === "system"
              ? `[CALL CONTEXT EVENT]: ${m.text.trim()}`
              : m.text.trim(),
        },
      ],
    }));

  const signal = req.signal;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let ttftMs: number | null = null;
      let ttfaMs: number | null = null;
      let fullText = "";
      let sentenceBuffer = "";
      let ttsQueue: Promise<void> = Promise.resolve();

      const safeEnqueue = (event: Record<string, unknown>) => {
        if (signal.aborted) return;
        try {
          controller.enqueue(encodeSse(event));
        } catch {
          // Stream already closed by client abort (barge-in)
        }
      };

      const enqueueTtsSentence = (sentence: string) => {
        if (!enableAudio || !sentence.trim() || signal.aborted) return;
        ttsQueue = ttsQueue.then(async () => {
          if (signal.aborted) return;
          try {
            const ttsStream = await ai.models.generateContentStream({
              model: "gemini-3.8-flash-lite-tts",
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: sentence.trim(),
                      speechMetadata: {
                        style: "Natural, grounded startup founder on a phone call, concise cadence",
                      },
                    },
                  ],
                },
              ],
              config: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName },
                  },
                },
              },
            });

            for await (const chunk of ttsStream) {
              if (signal.aborted) return;
              const audioData =
                chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
              if (audioData) {
                if (ttfaMs === null) {
                  ttfaMs = Date.now() - startedAt;
                }
                safeEnqueue({
                  type: "audio_chunk",
                  data: audioData,
                  sampleRate: 24000,
                  ttfaMs,
                });
              }
            }
          } catch (ttsErr) {
            if (signal.aborted) return;
            const why =
              ttsErr instanceof Error ? ttsErr.message : "Audio synthesis error";
            safeEnqueue({ type: "audio_warning", message: why });
          }
        });
      };

      try {
        const textStream = await ai.models.generateContentStream({
          model: "gemini-4-hydrogen",
          contents,
          config: {
            systemInstruction: fullSystemInstruction,
            thinkingConfig: {
              thinkingLevel:
                profile === "ultra_low" ? ThinkingLevel.LOW : ThinkingLevel.MEDIUM,
            },
          },
        });

        for await (const chunk of textStream) {
          if (signal.aborted) break;
          const delta = chunk.text ?? "";
          if (!delta) continue;

          if (ttftMs === null) {
            ttftMs = Date.now() - startedAt;
          }
          fullText += delta;
          sentenceBuffer += delta;
          safeEnqueue({ type: "text_delta", delta, ttftMs });

          if (profile === "ultra_low") {
            const { ready, remainder } = extractSpeakableSentences(sentenceBuffer);
            sentenceBuffer = remainder;
            for (const s of ready) {
              enqueueTtsSentence(s);
            }
          }
        }

        if (!signal.aborted) {
          const tail = sentenceBuffer.trim();
          if (tail) {
            enqueueTtsSentence(tail);
          }
          await ttsQueue;
          safeEnqueue({
            type: "done",
            fullText: fullText.trim(),
            ttftMs,
            ttfaMs,
            totalMs: Date.now() - startedAt,
          });
        }
      } catch (err) {
        if (!signal.aborted) {
          const message =
            err instanceof Error ? err.message : "Voice turn failed.";
          safeEnqueue({ type: "error", error: message });
        }
      } finally {
        try {
          controller.close();
        } catch {
          // Already closed
        }
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
