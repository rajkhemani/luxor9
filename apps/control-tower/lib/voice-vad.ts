export type VadEvent =
  | "SILENCE"
  | "SPEECH_START"
  | "SPEECH_CONTINUE"
  | "SPEECH_END"
  | "BARGE_IN";

export type VoiceProfileId = "ultra_low" | "balanced";

export type VoiceToneName = "Charon" | "Kore" | "Fenrir" | "Puck" | "Zephyr";

export type VoicePersonaId = "trace_galaxy_founder" | "luxor9_cmo_intake" | "custom";

export type VoiceTurn = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  timestamp: string;
  interrupted?: boolean;
  ttftMs?: number;
  ttfaMs?: number;
};

export const VAD_PRESETS = [
  {
    value: 0.35,
    label: "0.35 · Sensitive",
    note: "Catches soft speech fast; lower if the AI cuts itself off less.",
  },
  {
    value: 0.5,
    label: "0.50 · Balanced",
    note: "Recommended Silero VAD baseline for natural barge-in.",
  },
  {
    value: 0.65,
    label: "0.65 · Strict",
    note: "Filters room noise; requires clear speech to interrupt.",
  },
] as const;

export const VOICE_TONES: Array<{ name: VoiceToneName; description: string }> = [
  { name: "Charon", description: "Measured executive baritone" },
  { name: "Kore", description: "Crisp, clear advisor" },
  { name: "Fenrir", description: "Direct founder cadence" },
  { name: "Puck", description: "Energetic, conversational" },
  { name: "Zephyr", description: "Calm, neutral strategist" },
];

export const VOICE_PERSONAS: Record<
  Exclude<VoicePersonaId, "custom">,
  {
    label: string;
    subtitle: string;
    systemPrompt: string;
    quickPrompts: string[];
  }
> = {
  trace_galaxy_founder: {
    label: "Trace Galaxy — Founder Sales",
    subtitle: "Direct D2C & developer discovery call — sounds like a founder, never a script",
    systemPrompt: [
      "You are the founder of LUXOR9 on a live voice call for Trace Galaxy.",
      "Sound like a sharp, grounded founder talking peer-to-peer with a Dubai real-estate developer or growth lead — never like a chatbot or call-center script.",
      "Keep every spoken reply tight: 1 to 2 short natural sentences (under 35 words) so the caller can interrupt anytime.",
      "Avoid robotic filler ('Certainly!', 'Great question!', 'As an AI'). Get straight to the operational point.",
      "Emphasize accountable execution: LUXOR9 drafts an approvable blueprint, runs market and competitor research with verifiable evidence, and keeps every publish action gated by human Trust approval.",
      "Never fabricate metrics, client names, or guarantees. If interrupted, immediately drop your unfinished point and answer the caller's new question.",
    ].join("\n"),
    quickPrompts: [
      "We already have an agency handling our Creek Harbour launch. Why switch?",
      "Wait — stop. How do you guarantee your agents don't publish unverified claims?",
      "How fast can we take a new waterfront tower brief to a board-ready launch pack?",
    ],
  },
  luxor9_cmo_intake: {
    label: "LUXOR9 Executive CMO",
    subtitle: "Voice intake for Dubai market-to-launch briefs ready for blueprint handoff",
    systemPrompt: [
      "You are the LUXOR9 CMO Executive conducting a rapid voice intake with a Dubai real-estate developer.",
      "Speak in concise, executive 1 to 2 sentence turns (under 35 words).",
      "Gather the essentials naturally: project district, unit mix, target price band in AED, and launch window.",
      "Remind the operator that no campaign publishes automatically — every blueprint and publish step stays gated in the Control Tower Approval centre.",
      "If interrupted, drop your previous sentence immediately and pivot to what the operator just said.",
    ].join("\n"),
    quickPrompts: [
      "We're launching a 2 and 3 bedroom waterfront tower in Dubai Creek Harbour this Q2.",
      "Hold on — change the target price band to AED 3M to 7M for GCC family buyers.",
      "Summarize the launch brief so I can send it straight to a blueprint.",
    ],
  },
};

export const LOCAL_STACK_NOTES = [
  {
    tier: "GPU Local Target",
    stack: "Llama 3.1 8B + XTTS v2 + Silero VAD",
    footprint: "~6–8 GB VRAM",
    latency: "~300 ms",
  },
  {
    tier: "CPU Fallback",
    stack: "Llama 3.1 3B + Bark TTS + Silero VAD",
    footprint: "CPU only",
    latency: "~800 ms",
  },
] as const;

/**
 * Estimates voice speech probability in [0, 1] from a single PCM Float32 frame
 * using RMS energy above the ambient noise floor weighted by human-speech
 * zero-crossing rate (2%–32% crossings per sample).
 */
export function computeSpeechProbability(
  frame: Float32Array,
  noiseFloor = 0.008,
): number {
  if (frame.length === 0) return 0;

  let sumSq = 0;
  let zeroCrossings = 0;
  let prev = frame[0];

  for (let i = 0; i < frame.length; i += 1) {
    const sample = frame[i];
    sumSq += sample * sample;
    if (i > 0 && ((sample >= 0 && prev < 0) || (sample < 0 && prev >= 0))) {
      zeroCrossings += 1;
    }
    prev = sample;
  }

  const rms = Math.sqrt(sumSq / frame.length);
  if (rms <= noiseFloor) return 0;

  // Map RMS above noise floor onto a smooth 0..1 curve (0.08 RMS ≈ strong voice)
  const energyScore = Math.min(1, (rms - noiseFloor) / 0.065);

  const zcr = zeroCrossings / frame.length;
  // Voiced speech typically sits between 0.015 and 0.35 ZCR; penalize pure DC/high hiss
  const zcrWeight = zcr >= 0.01 && zcr <= 0.38 ? 1 : 0.45;

  return Math.max(0, Math.min(1, Number((energyScore * zcrWeight).toFixed(3))));
}

export type VadConfig = {
  threshold: number;
  minSpeechFrames?: number;
  hangoverFrames?: number;
  bargeInFrames?: number;
};

/**
 * Stateful frame-by-frame Voice Activity Detector with barge-in detection
 * and hangover tail suppression.
 */
export class VoiceActivityDetector {
  private threshold: number;
  private readonly minSpeechFrames: number;
  private readonly hangoverFrames: number;
  private readonly bargeInFrames: number;

  private speaking = false;
  private consecutiveSpeech = 0;
  private consecutiveSilence = 0;
  private consecutiveBargeIn = 0;

  constructor(config: VadConfig) {
    this.threshold = clampThreshold(config.threshold);
    this.minSpeechFrames = config.minSpeechFrames ?? 3;
    this.hangoverFrames = config.hangoverFrames ?? 14;
    this.bargeInFrames = config.bargeInFrames ?? 2;
  }

  setThreshold(threshold: number): void {
    this.threshold = clampThreshold(threshold);
  }

  getThreshold(): number {
    return this.threshold;
  }

  isSpeaking(): boolean {
    return this.speaking;
  }

  reset(): void {
    this.speaking = false;
    this.consecutiveSpeech = 0;
    this.consecutiveSilence = 0;
    this.consecutiveBargeIn = 0;
  }

  processFrame(probability: number, isAiSpeaking: boolean): VadEvent {
    const isVoice = probability >= this.threshold;

    if (isAiSpeaking) {
      if (isVoice) {
        this.consecutiveBargeIn += 1;
        if (this.consecutiveBargeIn >= this.bargeInFrames) {
          this.consecutiveBargeIn = 0;
          this.speaking = true;
          this.consecutiveSpeech = this.minSpeechFrames;
          this.consecutiveSilence = 0;
          return "BARGE_IN";
        }
      } else {
        this.consecutiveBargeIn = 0;
      }
      return "SILENCE";
    }

    this.consecutiveBargeIn = 0;

    if (isVoice) {
      this.consecutiveSilence = 0;
      this.consecutiveSpeech += 1;
      if (!this.speaking && this.consecutiveSpeech >= this.minSpeechFrames) {
        this.speaking = true;
        return "SPEECH_START";
      }
      if (this.speaking) {
        return "SPEECH_CONTINUE";
      }
      return "SILENCE";
    }

    this.consecutiveSpeech = 0;
    if (this.speaking) {
      this.consecutiveSilence += 1;
      if (this.consecutiveSilence >= this.hangoverFrames) {
        this.speaking = false;
        this.consecutiveSilence = 0;
        return "SPEECH_END";
      }
      return "SPEECH_CONTINUE";
    }

    return "SILENCE";
  }
}

export function clampThreshold(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.max(0.2, Math.min(0.85, Number(value.toFixed(2))));
}

/**
 * Generates the mandatory context-reset instruction injected when a caller
 * interrupts the AI mid-response so the model abandons its unfinished thought.
 */
export function buildBargeInSystemInjection(interruptedText: string): string {
  const snippet = interruptedText.trim().replace(/\s+/g, " ").slice(0, 140);
  if (!snippet) {
    return (
      "[BARGE-IN INTERRUPT] The caller interrupted you while you were speaking. " +
      "Drop your previous thought immediately and address their new input in 1-2 short spoken sentences."
    );
  }
  return (
    `[BARGE-IN INTERRUPT] The caller interrupted you mid-response while you were saying: "${snippet}". ` +
    "Drop that unfinished thought immediately — do not finish or repeat it. " +
    "Pivot directly to what the caller just asked in 1-2 natural spoken sentences."
  );
}

/**
 * Splits a streaming text buffer into complete speakable sentences so TTS can
 * begin synthesizing audio before the full LLM response finishes.
 */
export function extractSpeakableSentences(buffer: string): {
  ready: string[];
  remainder: string;
} {
  const ready: string[] = [];
  let cursor = 0;
  const regex = /([^.!?\n]+[.!?\n]+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(buffer)) !== null) {
    const candidate = match[1].trim();
    if (candidate.length >= 6) {
      ready.push(candidate);
      cursor = match.index + match[0].length;
    }
  }

  return {
    ready,
    remainder: buffer.slice(cursor),
  };
}

/**
 * Encodes mono Float32 PCM samples into a 16-bit signed little-endian WAV buffer.
 */
export function encodeWavPcm16(
  samples: Float32Array,
  sampleRate: number,
): Uint8Array {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  return new Uint8Array(buffer);
}

function writeAscii(view: DataView, offset: number, text: string): void {
  for (let i = 0; i < text.length; i += 1) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

/**
 * Decodes base64-encoded raw 16-bit signed little-endian PCM (24kHz mono)
 * into a Float32Array suitable for AudioContext.createBuffer().
 */
export function pcm16Base64ToFloat32(base64: string): Float32Array<ArrayBuffer> {
  let bytes: Uint8Array;
  if (typeof Buffer !== "undefined") {
    bytes = new Uint8Array(Buffer.from(base64, "base64"));
  } else {
    const binary = atob(base64);
    bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
  }

  const sampleCount = Math.floor(bytes.byteLength / 2);
  const float32 = new Float32Array(new ArrayBuffer(sampleCount * 4));
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  for (let i = 0; i < sampleCount; i += 1) {
    float32[i] = view.getInt16(i * 2, true) / 0x8000;
  }
  return float32;
}

export function uint8ToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * Formats the live voice transcript into a concise LUXOR9 workflow brief
 * suitable for Control Tower blueprint intake.
 */
export function buildWorkflowSummaryFromCall(
  turns: VoiceTurn[],
  personaLabel: string,
  bargeInCount: number,
): string {
  const userUtterances = turns
    .filter((t) => t.role === "user")
    .map((t) => t.text.trim())
    .filter(Boolean);

  if (userUtterances.length === 0) {
    return `Voice intake (${personaLabel}) — Dubai residential market-to-launch brief`;
  }

  const combined = userUtterances.slice(-3).join(" | ").slice(0, 260);
  const interruptNote = bargeInCount > 0 ? ` (${bargeInCount} barge-in pivot${bargeInCount === 1 ? "" : "s"})` : "";
  return `Voice Call Brief [${personaLabel}]${interruptNote}: ${combined}`;
}
