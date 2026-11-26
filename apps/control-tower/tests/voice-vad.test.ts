import { describe, expect, it } from "vitest";
import {
  VoiceActivityDetector,
  buildBargeInSystemInjection,
  buildWorkflowSummaryFromCall,
  clampThreshold,
  computeSpeechProbability,
  encodeWavPcm16,
  extractSpeakableSentences,
  pcm16Base64ToFloat32,
  uint8ToBase64,
} from "../lib/voice-vad";

function makeSineFrame(length: number, amplitude: number, freqHz = 320, sampleRate = 16000): Float32Array {
  const out = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    out[i] = Math.sin((2 * Math.PI * freqHz * i) / sampleRate) * amplitude;
  }
  return out;
}

describe("voice-vad pure engine", () => {
  it("estimates near-zero probability for silence and high probability for speech-band signal", () => {
    const quiet = new Float32Array(512);
    const spoken = makeSineFrame(512, 0.12);

    expect(computeSpeechProbability(quiet)).toBe(0);
    expect(computeSpeechProbability(spoken)).toBeGreaterThan(0.75);
  });

  it("respects configurable VAD threshold presets (0.35, 0.50, 0.65)", () => {
    const vad = new VoiceActivityDetector({
      threshold: 0.65,
      minSpeechFrames: 2,
      hangoverFrames: 2,
    });

    // Moderate probability 0.52 should NOT trigger at 0.65 strict threshold
    expect(vad.processFrame(0.52, false)).toBe("SILENCE");
    expect(vad.processFrame(0.52, false)).toBe("SILENCE");

    // Dropping threshold to 0.35 immediately captures the same 0.52 speech level
    vad.setThreshold(0.35);
    expect(vad.processFrame(0.52, false)).toBe("SILENCE");
    expect(vad.processFrame(0.52, false)).toBe("SPEECH_START");
    expect(vad.processFrame(0.1, false)).toBe("SPEECH_CONTINUE");
    expect(vad.processFrame(0.1, false)).toBe("SPEECH_END");
  });

  it("emits BARGE_IN immediately when caller speaks over active AI playback", () => {
    const vad = new VoiceActivityDetector({
      threshold: 0.5,
      bargeInFrames: 2,
    });

    // Brief single-frame click should not trigger barge-in
    expect(vad.processFrame(0.7, true)).toBe("SILENCE");
    expect(vad.processFrame(0.1, true)).toBe("SILENCE");

    // Two sustained speech frames while AI is speaking -> BARGE_IN
    expect(vad.processFrame(0.72, true)).toBe("SILENCE");
    expect(vad.processFrame(0.81, true)).toBe("BARGE_IN");
    expect(vad.isSpeaking()).toBe(true);
  });

  it("clamps threshold safely within [0.20, 0.85]", () => {
    expect(clampThreshold(0.05)).toBe(0.2);
    expect(clampThreshold(0.99)).toBe(0.85);
    expect(clampThreshold(Number.NaN)).toBe(0.5);
  });

  it("injects barge-in context reset system message referencing the cut-off text", () => {
    const injected = buildBargeInSystemInjection(
      "Our typical rollout takes about two weeks across Dubai Creek",
    );
    expect(injected).toContain("[BARGE-IN INTERRUPT]");
    expect(injected).toContain("Drop that unfinished thought immediately");
    expect(injected).toContain("Dubai Creek");
  });

  it("extracts speakable sentences incrementally for low-latency TTS pipelining", () => {
    const first = extractSpeakableSentences("We cut launch brief latency.");
    expect(first.ready).toEqual(["We cut launch brief latency."]);
    expect(first.remainder).toBe("");

    const partial = extractSpeakableSentences("Every claim is verified. Still streaming");
    expect(partial.ready).toEqual(["Every claim is verified."]);
    expect(partial.remainder).toBe(" Still streaming");
  });

  it("encodes 16-bit WAV header and decodes raw 16-bit PCM base64 accurately", () => {
    const samples = new Float32Array([0, 0.5, -0.5, 1, -1]);
    const wav = encodeWavPcm16(samples, 16000);
    expect(wav.byteLength).toBe(44 + samples.length * 2);
    expect(String.fromCharCode(wav[0], wav[1], wav[2], wav[3])).toBe("RIFF");

    const rawPcm = wav.slice(44);
    const decoded = pcm16Base64ToFloat32(uint8ToBase64(rawPcm));
    expect(decoded.length).toBe(samples.length);
    expect(decoded[1]).toBeCloseTo(0.5, 2);
    expect(decoded[2]).toBeCloseTo(-0.5, 2);
  });

  it("summarizes call utterances and barge-in pivots for Control Tower workflow handoff", () => {
    const brief = buildWorkflowSummaryFromCall(
      [
        { id: "1", role: "user", text: "Dubai Creek Harbour 2BR launch", timestamp: "12:00" },
        { id: "2", role: "assistant", text: "Got it.", timestamp: "12:00" },
        { id: "3", role: "user", text: "Focus on AED 3M to 6M GCC buyers", timestamp: "12:01" },
      ],
      "Trace Galaxy — Founder Sales",
      2,
    );
    expect(brief).toContain("Trace Galaxy — Founder Sales");
    expect(brief).toContain("2 barge-in pivots");
    expect(brief).toContain("Dubai Creek Harbour");
  });
});
