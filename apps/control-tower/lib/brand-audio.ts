/**
 * LUXOR9 Acoustic & Sonic Identity Synthesizer (Web Audio API)
 * Institutional, calm, precision-calibrated harmonic cues — never arcade or jarring.
 */

export type BrandSoundCue =
  | "sonic-logo"
  | "session-start"
  | "session-end"
  | "confirmation"
  | "evidence-receipt"
  | "notification"
  | "warning"
  | "error";

export type BrandSoundSpec = {
  id: BrandSoundCue;
  name: string;
  durationMs: number;
  pitchHz: string;
  character: string;
  trigger: string;
};

export const BRAND_SOUND_SPECS: BrandSoundSpec[] = [
  {
    id: "sonic-logo",
    name: "LUXOR9 Sonic Signature",
    durationMs: 920,
    pitchHz: "D4 (293.7Hz) → A4 (440Hz) → D5 (587.3Hz)",
    character: "Warm architectural fifth resolving to octave — restrained resonance.",
    trigger: "Keynote intro, executive briefing video sign-off, Control Tower cold boot (opt-in).",
  },
  {
    id: "session-start",
    name: "Voice Session Start",
    durationMs: 260,
    pitchHz: "G4 (392Hz) → D5 (587.3Hz)",
    character: "Crisp ascending open fifth confirming active governed microphone.",
    trigger: "Multi-Voice Agent Control Tower live session open.",
  },
  {
    id: "session-end",
    name: "Voice Session End",
    durationMs: 280,
    pitchHz: "D5 (587.3Hz) → G4 (392Hz)",
    character: "Clean descending cadence signaling microphone release & transcript archive.",
    trigger: "Voice session termination or mute lock.",
  },
  {
    id: "confirmation",
    name: "Approval Confirmed",
    durationMs: 320,
    pitchHz: "E4 (329.6Hz) → B4 (493.9Hz)",
    character: "Decisive precision chime acknowledging bound executive authorization.",
    trigger: "Founder or principal signs an approval gate.",
  },
  {
    id: "evidence-receipt",
    name: "Evidence Receipt Sealed",
    durationMs: 240,
    pitchHz: "A4 (440Hz) + E5 (659.3Hz) subtle click-harmonic",
    character: "Tactile mechanical-seal transient indicating immutable audit entry.",
    trigger: "Verified proof receipt committed to Evidence Ledger.",
  },
  {
    id: "notification",
    name: "Delegation Notice",
    durationMs: 180,
    pitchHz: "C5 (523.3Hz)",
    character: "Single soft glass-marimba pulse; never demands startled attention.",
    trigger: "Specialist agent receives delegated work or posts non-blocking update.",
  },
  {
    id: "warning",
    name: "Approval / Source Hold",
    durationMs: 340,
    pitchHz: "F4 (349.2Hz) → E4 (329.6Hz)",
    character: "Measured half-step pause tone prompting calm review.",
    trigger: "Pending human approval or missing verified source detected.",
  },
  {
    id: "error",
    name: "Policy Block / Safe Halt",
    durationMs: 360,
    pitchHz: "D3 (146.8Hz) → C3 (130.8Hz)",
    character: "Low muted damped interval — firm, never harsh or alarmist.",
    trigger: "Execution failed safely or Trust Boundary rejected unauthorized action.",
  },
];

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtor();
  }
  if (sharedAudioCtx.state === "suspended") {
    void sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
}

function playTone(
  ctx: AudioContext,
  freq: number,
  startOffsetSec: number,
  durationSec: number,
  peakGain = 0.08,
  type: OscillatorType = "sine",
) {
  const now = ctx.currentTime + startOffsetSec;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + durationSec + 0.02);
}

export function playBrandSound(cue: BrandSoundCue, muted = false): boolean {
  if (muted) return false;
  const ctx = getAudioContext();
  if (!ctx) return false;

  switch (cue) {
    case "sonic-logo":
      playTone(ctx, 293.66, 0.0, 0.55, 0.075, "sine");
      playTone(ctx, 440.0, 0.18, 0.6, 0.065, "triangle");
      playTone(ctx, 587.33, 0.36, 0.56, 0.055, "sine");
      break;
    case "session-start":
      playTone(ctx, 392.0, 0.0, 0.14, 0.07, "sine");
      playTone(ctx, 587.33, 0.1, 0.18, 0.07, "sine");
      break;
    case "session-end":
      playTone(ctx, 587.33, 0.0, 0.14, 0.065, "sine");
      playTone(ctx, 392.0, 0.11, 0.18, 0.06, "sine");
      break;
    case "confirmation":
      playTone(ctx, 329.63, 0.0, 0.16, 0.07, "triangle");
      playTone(ctx, 493.88, 0.11, 0.24, 0.075, "sine");
      break;
    case "evidence-receipt":
      playTone(ctx, 440.0, 0.0, 0.08, 0.06, "triangle");
      playTone(ctx, 659.25, 0.06, 0.18, 0.055, "sine");
      break;
    case "notification":
      playTone(ctx, 523.25, 0.0, 0.18, 0.06, "sine");
      break;
    case "warning":
      playTone(ctx, 349.23, 0.0, 0.16, 0.065, "triangle");
      playTone(ctx, 329.63, 0.15, 0.2, 0.06, "triangle");
      break;
    case "error":
      playTone(ctx, 146.83, 0.0, 0.18, 0.085, "triangle");
      playTone(ctx, 130.81, 0.15, 0.22, 0.08, "sine");
      break;
  }
  return true;
}
