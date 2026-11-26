"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { client } from "@/lib/api";
import {
  LOCAL_STACK_NOTES,
  VAD_PRESETS,
  VOICE_PERSONAS,
  VOICE_TONES,
  VoiceActivityDetector,
  buildBargeInSystemInjection,
  buildWorkflowSummaryFromCall,
  clampThreshold,
  computeSpeechProbability,
  encodeWavPcm16,
  pcm16Base64ToFloat32,
  uint8ToBase64,
  type VoicePersonaId,
  type VoiceProfileId,
  type VoiceToneName,
  type VoiceTurn,
} from "@/lib/voice-vad";
import { VoiceWaveMeter } from "./VoiceWaveMeter";

type CallStatus =
  | "idle"
  | "listening"
  | "caller_speaking"
  | "transcribing"
  | "agent_speaking"
  | "barge_in";

function formatClock(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function statusText(status: CallStatus, micActive: boolean): string {
  switch (status) {
    case "listening":
      return micActive ? "Listening · Full-Duplex Mic Live" : "Ready";
    case "caller_speaking":
      return "Caller Speaking · Capturing Utterance";
    case "transcribing":
      return "Transcribing Utterance";
    case "agent_speaking":
      return "Agent Speaking · Barge-In Armed";
    case "barge_in":
      return "Barge-In Triggered · Context Reset";
    default:
      return micActive ? "Listening · Mic Live" : "Standby · Mic Off";
  }
}

export function VoiceBridgeConsole() {
  const [micActive, setMicActive] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [vadThreshold, setVadThreshold] = useState(0.5);
  const [profile, setProfile] = useState<VoiceProfileId>("ultra_low");
  const [voiceName, setVoiceName] = useState<VoiceToneName>("Charon");
  const [personaId, setPersonaId] = useState<VoicePersonaId>("trace_galaxy_founder");
  const [systemPrompt, setSystemPrompt] = useState<string>(
    VOICE_PERSONAS.trace_galaxy_founder.systemPrompt,
  );
  const [turns, setTurns] = useState<VoiceTurn[]>([
    {
      id: "turn_welcome",
      role: "assistant",
      text: "LUXOR9 Voice Bridge is ready. Start your live mic or send a prospect objection below — interrupt anytime to test sub-second barge-in.",
      timestamp: "Ready",
    },
  ]);
  const [composerText, setComposerText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [micNotice, setMicNotice] = useState<string | null>(null);
  const [vadHistory, setVadHistory] = useState<number[]>(() => new Array(48).fill(0));
  const [bargeInCount, setBargeInCount] = useState(0);
  const [lastTtftMs, setLastTtftMs] = useState<number | null>(null);
  const [lastTtfaMs, setLastTtfaMs] = useState<number | null>(null);
  const [lastBargeInMs, setLastBargeInMs] = useState<number | null>(null);
  const [recordingWorkflow, setRecordingWorkflow] = useState(false);
  const [createdWorkflowId, setCreatedWorkflowId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // Refs to prevent stale closures inside Web Audio callbacks & streaming loops
  const vadRef = useRef<VoiceActivityDetector>(
    new VoiceActivityDetector({ threshold: 0.5, minSpeechFrames: 3, hangoverFrames: 12, bargeInFrames: 2 }),
  );
  const turnsRef = useRef<VoiceTurn[]>(turns);
  const systemPromptRef = useRef(systemPrompt);
  const voiceNameRef = useRef<VoiceToneName>(voiceName);
  const profileRef = useRef<VoiceProfileId>(profile);
  const audioEnabledRef = useRef(audioEnabled);
  const isAiSpeakingRef = useRef(false);
  const activeAssistantIdRef = useRef<string | null>(null);
  const activeAssistantTextRef = useRef<string>("");
  const pendingBargeInContextRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Web Audio input capture refs
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const capturedChunksRef = useRef<Float32Array[]>([]);
  const sampleRateRef = useRef<number>(16000);

  // Web Audio 24kHz gapless playback queue refs
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const scheduledSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    turnsRef.current = turns;
  }, [turns]);

  useEffect(() => {
    systemPromptRef.current = systemPrompt;
  }, [systemPrompt]);

  useEffect(() => {
    voiceNameRef.current = voiceName;
  }, [voiceName]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    audioEnabledRef.current = audioEnabled;
  }, [audioEnabled]);

  useEffect(() => {
    vadRef.current.setThreshold(vadThreshold);
  }, [vadThreshold]);

  const stopAllPlayback = useCallback(() => {
    for (const src of scheduledSourcesRef.current) {
      try {
        src.stop();
        src.disconnect();
      } catch {
        // Source may have already finished
      }
    }
    scheduledSourcesRef.current.clear();
    if (outputAudioCtxRef.current) {
      nextPlayTimeRef.current = outputAudioCtxRef.current.currentTime;
    } else {
      nextPlayTimeRef.current = 0;
    }
    isAiSpeakingRef.current = false;
  }, []);

  const ensureOutputAudioCtx = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null;
    if (!outputAudioCtxRef.current) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      outputAudioCtxRef.current = new Ctx({ sampleRate: 24000 });
    }
    if (outputAudioCtxRef.current.state === "suspended") {
      void outputAudioCtxRef.current.resume().catch(() => {});
    }
    return outputAudioCtxRef.current;
  }, []);

  const schedulePcmChunk = useCallback(
    (base64Pcm: string, sampleRate = 24000) => {
      if (!audioEnabledRef.current) return;
      const ctx = ensureOutputAudioCtx();
      if (!ctx) return;

      const float32 = pcm16Base64ToFloat32(base64Pcm);
      if (float32.length === 0) return;

      const buffer = ctx.createBuffer(1, float32.length, sampleRate);
      buffer.copyToChannel(float32, 0);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      const now = ctx.currentTime;
      const startAt = Math.max(now + 0.015, nextPlayTimeRef.current);
      nextPlayTimeRef.current = startAt + buffer.duration;

      scheduledSourcesRef.current.add(source);
      isAiSpeakingRef.current = true;
      source.onended = () => {
        scheduledSourcesRef.current.delete(source);
        if (scheduledSourcesRef.current.size === 0 && !abortControllerRef.current) {
          isAiSpeakingRef.current = false;
          setCallStatus((prev) => (prev === "agent_speaking" ? (micActive ? "listening" : "idle") : prev));
        }
      };
      source.start(startAt);
    },
    [ensureOutputAudioCtx, micActive],
  );

  const triggerBargeIn = useCallback(
    (reason: "vad" | "manual") => {
      const startedStop = performance.now();
      const interruptedSnippet = activeAssistantTextRef.current;
      const assistantId = activeAssistantIdRef.current;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      stopAllPlayback();
      setIsStreaming(false);

      const stopElapsedMs = Math.max(1, Math.round(performance.now() - startedStop));
      setLastBargeInMs(stopElapsedMs);
      setBargeInCount((c) => c + 1);
      setCallStatus("barge_in");

      const injection = buildBargeInSystemInjection(interruptedSnippet);
      pendingBargeInContextRef.current = injection;

      setTurns((prev) => {
        const updated = assistantId
          ? prev.map((t) =>
              t.id === assistantId ? { ...t, interrupted: true } : t,
            )
          : prev;
        return [
          ...updated,
          {
            id: `sys_barge_${Date.now()}`,
            role: "system",
            text:
              reason === "vad"
                ? `VAD barge-in detected (cutoff ${stopElapsedMs} ms). Context reset injected: "${injection}"`
                : `Manual barge-in triggered (cutoff ${stopElapsedMs} ms). Context reset injected: "${injection}"`,
            timestamp: formatClock(),
          },
        ];
      });

      activeAssistantIdRef.current = null;
      activeAssistantTextRef.current = "";
    },
    [stopAllPlayback],
  );

  const runVoiceTurn = useCallback(
    async (userText: string) => {
      const clean = userText.trim();
      if (!clean) return;

      // If agent is currently speaking when caller submits a new utterance, execute barge-in first!
      if (isAiSpeakingRef.current || abortControllerRef.current) {
        triggerBargeIn("manual");
      }

      setError(null);
      const userTurn: VoiceTurn = {
        id: `usr_${Date.now()}`,
        role: "user",
        text: clean,
        timestamp: formatClock(),
      };
      const assistantId = `ast_${Date.now() + 1}`;
      const assistantPlaceholder: VoiceTurn = {
        id: assistantId,
        role: "assistant",
        text: "",
        timestamp: formatClock(),
      };

      const historyForServer = [...turnsRef.current, userTurn]
        .filter((t) => t.id !== "turn_welcome")
        .map((t) => ({ role: t.role, text: t.text }));

      setTurns((prev) => [...prev, userTurn, assistantPlaceholder]);
      activeAssistantIdRef.current = assistantId;
      activeAssistantTextRef.current = "";

      const bargeInContext = pendingBargeInContextRef.current;
      pendingBargeInContextRef.current = null;

      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsStreaming(true);
      setCallStatus("agent_speaking");
      isAiSpeakingRef.current = true;

      try {
        const res = await fetch("/api/voice/turn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: historyForServer,
            systemPrompt: systemPromptRef.current,
            voiceName: voiceNameRef.current,
            profile: profileRef.current,
            bargeInContext,
            enableAudio: audioEnabledRef.current,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const payload = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(payload?.error || `Voice turn failed (HTTP ${res.status})`);
        }
        if (!res.body) {
          throw new Error("Voice stream unavailable.");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let sseBuffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          sseBuffer += decoder.decode(value, { stream: true });

          const blocks = sseBuffer.split("\n\n");
          sseBuffer = blocks.pop() ?? "";

          for (const block of blocks) {
            const dataLine = block
              .split("\n")
              .find((line) => line.startsWith("data: "));
            if (!dataLine) continue;

            const evt = JSON.parse(dataLine.slice(6)) as {
              type: string;
              delta?: string;
              data?: string;
              sampleRate?: number;
              ttftMs?: number;
              ttfaMs?: number;
              error?: string;
              message?: string;
            };

            if (evt.type === "text_delta" && evt.delta) {
              activeAssistantTextRef.current += evt.delta;
              if (typeof evt.ttftMs === "number") setLastTtftMs(evt.ttftMs);
              const snapshot = activeAssistantTextRef.current;
              const ttft = evt.ttftMs;
              setTurns((prev) =>
                prev.map((t) =>
                  t.id === assistantId ? { ...t, text: snapshot, ttftMs: ttft } : t,
                ),
              );
            } else if (evt.type === "audio_chunk" && evt.data) {
              if (typeof evt.ttfaMs === "number") setLastTtfaMs(evt.ttfaMs);
              schedulePcmChunk(evt.data, evt.sampleRate ?? 24000);
            } else if (evt.type === "audio_warning" && evt.message) {
              setError(`Audio synthesis notice: ${evt.message}`);
            } else if (evt.type === "error" && evt.error) {
              throw new Error(evt.error);
            } else if (evt.type === "done") {
              if (typeof evt.ttftMs === "number") setLastTtftMs(evt.ttftMs);
              if (typeof evt.ttfaMs === "number") setLastTtfaMs(evt.ttfaMs);
            }
          }
        }
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") {
          return;
        }
        const message = err instanceof Error ? err.message : "Voice turn failed.";
        setError(message);
        setTurns((prev) =>
          prev.filter((t) => !(t.id === assistantId && t.text.trim() === "")),
        );
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
        setIsStreaming(false);
        if (scheduledSourcesRef.current.size === 0) {
          isAiSpeakingRef.current = false;
          setCallStatus((prev) =>
            prev === "barge_in" ? prev : micActive ? "listening" : "idle",
          );
        }
      }
    },
    [micActive, schedulePcmChunk, triggerBargeIn],
  );

  const flushCapturedSpeech = useCallback(async () => {
    const chunks = capturedChunksRef.current;
    capturedChunksRef.current = [];
    if (chunks.length === 0) return;

    const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
    if (totalLen < sampleRateRef.current * 0.25) {
      // Ignore micro-clicks shorter than 250ms
      setCallStatus("listening");
      return;
    }

    const merged = new Float32Array(totalLen);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.length;
    }

    setCallStatus("transcribing");
    try {
      const wavBytes = encodeWavPcm16(merged, sampleRateRef.current);
      const audioBase64 = uint8ToBase64(wavBytes);
      const res = await fetch("/api/voice/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioBase64, mimeType: "audio/wav" }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        transcript?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(payload.error || `Transcription failed (HTTP ${res.status})`);
      }
      const transcript = (payload.transcript || "").trim();
      if (transcript) {
        await runVoiceTurn(transcript);
      } else {
        setCallStatus("listening");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transcription failed.");
      setCallStatus("listening");
    }
  }, [runVoiceTurn]);

  const stopMicSession = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      void inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }
    if (mediaStreamRef.current) {
      for (const track of mediaStreamRef.current.getTracks()) {
        track.stop();
      }
      mediaStreamRef.current = null;
    }
    capturedChunksRef.current = [];
    vadRef.current.reset();
    setMicActive(false);
    setCallStatus("idle");
  }, []);

  const startMicSession = useCallback(async () => {
    setError(null);
    setMicNotice(null);
    ensureOutputAudioCtx();

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setMicNotice(
        "Microphone capture is unavailable in this browser context. Use the quick prospect prompts or utterance composer below — audio playback and barge-in remain active.",
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new Ctx({ sampleRate: 16000 });
      sampleRateRef.current = audioCtx.sampleRate;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(1024, 1, 1);

      source.connect(processor);
      processor.connect(audioCtx.destination);

      mediaStreamRef.current = stream;
      inputAudioCtxRef.current = audioCtx;
      processorRef.current = processor;
      vadRef.current.reset();

      processor.onaudioprocess = (event) => {
        const input = event.inputBuffer.getChannelData(0);
        const frameCopy = new Float32Array(input.length);
        frameCopy.set(input);

        const prob = computeSpeechProbability(frameCopy);
        setVadHistory((prev) => [...prev.slice(1), prob]);

        const vadEvent = vadRef.current.processFrame(prob, isAiSpeakingRef.current);

        if (vadEvent === "BARGE_IN") {
          capturedChunksRef.current = [frameCopy];
          triggerBargeIn("vad");
        } else if (vadEvent === "SPEECH_START") {
          capturedChunksRef.current = [frameCopy];
          setCallStatus("caller_speaking");
        } else if (vadEvent === "SPEECH_CONTINUE") {
          capturedChunksRef.current.push(frameCopy);
        } else if (vadEvent === "SPEECH_END") {
          capturedChunksRef.current.push(frameCopy);
          void flushCapturedSpeech();
        }
      };

      setMicActive(true);
      setCallStatus("listening");
    } catch (err) {
      const why = err instanceof Error ? err.message : "Microphone permission denied";
      setMicNotice(
        `Microphone unavailable (${why}). You can still test live streaming turns, founder audio playback, and barge-in using the utterance controls below.`,
      );
    }
  }, [ensureOutputAudioCtx, flushCapturedSpeech, triggerBargeIn]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      stopAllPlayback();
      stopMicSession();
    };
  }, [stopAllPlayback, stopMicSession]);

  function onSelectPersona(next: VoicePersonaId) {
    setPersonaId(next);
    if (next !== "custom") {
      setSystemPrompt(VOICE_PERSONAS[next].systemPrompt);
    }
  }

  async function onSubmitUtterance(e: FormEvent) {
    e.preventDefault();
    if (!composerText.trim()) return;
    const text = composerText.trim();
    setComposerText("");
    await runVoiceTurn(text);
  }

  async function onRecordToWorkflow() {
    setRecordingWorkflow(true);
    setError(null);
    try {
      const personaLabel =
        personaId === "custom" ? "Custom Founder Persona" : VOICE_PERSONAS[personaId].label;
      const brief = buildWorkflowSummaryFromCall(turns, personaLabel, bargeInCount);
      const res = await client.chat(brief);
      setCreatedWorkflowId(res.workflow.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record workflow.");
    } finally {
      setRecordingWorkflow(false);
    }
  }

  const activePersonaQuickPrompts = useMemo(() => {
    if (personaId === "custom") {
      return VOICE_PERSONAS.trace_galaxy_founder.quickPrompts;
    }
    return VOICE_PERSONAS[personaId].quickPrompts;
  }, [personaId]);

  const activeVadNote = useMemo(() => {
    if (vadThreshold <= 0.4) {
      return "Low threshold (0.35): picks up soft speech quickly. Raise toward 0.50 if ambient echo cuts off playback.";
    }
    if (vadThreshold >= 0.6) {
      return "Strict threshold (0.65): rejects background noise. Lower toward 0.50 if gentle interruptions are missed.";
    }
    return "Balanced Silero VAD baseline (0.50): reliable interruption detection without false cutoffs.";
  }, [vadThreshold]);

  return (
    <section className="voice-page">
      <div className="voice-header">
        <div>
          <h1>Voice Bridge</h1>
          <p className="muted">
            Full-duplex voice AI with configurable VAD sensitivity, instant audio barge-in,
            context-reset injection, and Trust-gated workflow handoff.
          </p>
        </div>
        <div className="voice-header-actions">
          <button
            type="button"
            onClick={micActive ? stopMicSession : () => void startMicSession()}
            className={micActive ? "danger" : undefined}
          >
            {micActive ? "End Live Mic" : "Start Live Mic"}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => triggerBargeIn("manual")}
            aria-label="Interrupt agent and trigger barge-in context reset"
          >
            Interrupt (Barge-In)
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setAudioEnabled((prev) => {
                if (prev) stopAllPlayback();
                return !prev;
              });
            }}
          >
            {audioEnabled ? "Audio Output: On" : "Audio Output: Muted"}
          </button>
        </div>
      </div>

      {micNotice && (
        <div className="voice-notice" role="status">
          {micNotice}
        </div>
      )}
      {error && (
        <div className="voice-error" role="alert">
          {error}
        </div>
      )}

      <div className="voice-metrics-grid">
        <div className="stat">
          <strong className="voice-mono">{lastTtftMs !== null ? `${lastTtftMs} ms` : "—"}</strong>
          First token (TTFT)
        </div>
        <div className="stat">
          <strong className="voice-mono">{lastTtfaMs !== null ? `${lastTtfaMs} ms` : "—"}</strong>
          First audio (TTFA)
        </div>
        <div className="stat">
          <strong className="voice-mono">{bargeInCount}</strong>
          Barge-in cutoffs{lastBargeInMs !== null ? ` · ${lastBargeInMs} ms stop` : ""}
        </div>
        <div className="stat">
          <strong className="voice-mono">{vadThreshold.toFixed(2)}</strong>
          VAD threshold
        </div>
      </div>

      <div className="voice-workspace">
        {/* Primary Column: Live VAD Meter + Full-Duplex Transcript + Utterance Controls */}
        <div className="voice-primary">
          <div className="panel voice-panel">
            <VoiceWaveMeter
              history={vadHistory}
              threshold={vadThreshold}
              isLive={micActive}
              stateLabel={statusText(callStatus, micActive)}
            />

            <div className="voice-transcript" aria-live="polite" data-testid="voice-transcript">
              {turns.map((turn) => (
                <div key={turn.id} className={`voice-turn voice-turn-${turn.role}`}>
                  <div className="voice-turn-meta">
                    <span>
                      {turn.role === "user"
                        ? "Caller"
                        : turn.role === "assistant"
                          ? `Founder Agent (${voiceName})`
                          : "Barge-In Context Manager"}
                    </span>
                    <span className="voice-mono">
                      {turn.timestamp}
                      {turn.ttftMs ? ` · ${turn.ttftMs}ms TTFT` : ""}
                      {turn.interrupted ? " · Interrupted mid-turn" : ""}
                    </span>
                  </div>
                  <p className="voice-turn-body">
                    {turn.text || (isStreaming ? "Streaming response…" : "")}
                  </p>
                </div>
              ))}
            </div>

            <div className="voice-quick-prompts">
              <span className="muted voice-label">Test prospect utterances</span>
              <div className="voice-quick-row">
                {activePersonaQuickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="secondary voice-chip-btn"
                    onClick={() => void runVoiceTurn(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <form className="composer voice-composer" onSubmit={onSubmitUtterance}>
              <label htmlFor="voice-utterance-input" className="sr-only">
                Speak or type a prospect utterance
              </label>
              <input
                id="voice-utterance-input"
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                placeholder="Type a prospect utterance or interruption (submitting while speaking triggers barge-in)…"
              />
              <button type="submit">Send Turn</button>
            </form>

            <div className="voice-handoff-row">
              <div>
                <strong>Accountable Handoff</strong>
                <p className="muted voice-handoff-sub">
                  Promote this call transcript into a Trust-gated LUXOR9 blueprint. No campaign
                  executes without human approval.
                </p>
              </div>
              <div className="voice-handoff-cta">
                <button
                  type="button"
                  className="secondary"
                  disabled={recordingWorkflow}
                  onClick={() => void onRecordToWorkflow()}
                >
                  {recordingWorkflow ? "Recording…" : "Record Call to Workflow"}
                </button>
                {createdWorkflowId && (
                  <Link href={`/workflows/${createdWorkflowId}`} className="capability-link">
                    Open {createdWorkflowId} →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Column: Silero VAD Sensitivity + Founder Persona + Local Deployment Reference */}
        <aside className="voice-sidebar">
          <div className="panel voice-panel">
            <h2>VAD &amp; Barge-In Tuning</h2>
            <p className="muted voice-sub">
              Tune Silero-style voice activity sensitivity to balance instant interruption against
              ambient noise.
            </p>

            <div className="voice-field">
              <div className="voice-field-head">
                <label htmlFor="vad-threshold-slider">Sensitivity threshold</label>
                <span className="voice-mono">{vadThreshold.toFixed(2)}</span>
              </div>
              <div className="voice-segmented" role="group" aria-label="VAD threshold presets">
                {VAD_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    className={
                      Math.abs(vadThreshold - preset.value) < 0.01
                        ? "voice-seg-btn is-active"
                        : "voice-seg-btn"
                    }
                    onClick={() => setVadThreshold(preset.value)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <input
                id="vad-threshold-slider"
                type="range"
                min={0.2}
                max={0.85}
                step={0.05}
                value={vadThreshold}
                onChange={(e) => setVadThreshold(clampThreshold(Number(e.target.value)))}
                className="voice-range"
              />
              <p className="muted voice-hint">{activeVadNote}</p>
            </div>

            <div className="voice-field">
              <span className="voice-label">Latency pipeline</span>
              <div className="voice-segmented" role="group" aria-label="Latency profile">
                <button
                  type="button"
                  className={profile === "ultra_low" ? "voice-seg-btn is-active" : "voice-seg-btn"}
                  onClick={() => setProfile("ultra_low")}
                >
                  Ultra-Low Latency
                </button>
                <button
                  type="button"
                  className={profile === "balanced" ? "voice-seg-btn is-active" : "voice-seg-btn"}
                  onClick={() => setProfile("balanced")}
                >
                  Balanced Quality
                </button>
              </div>
            </div>

            <div className="voice-field">
              <label htmlFor="voice-tone-select">Speaker voice</label>
              <select
                id="voice-tone-select"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value as VoiceToneName)}
                className="voice-select"
              >
                {VOICE_TONES.map((tone) => (
                  <option key={tone.name} value={tone.name}>
                    {tone.name} — {tone.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="panel voice-panel">
            <h2>Founder Sales Persona</h2>
            <p className="muted voice-sub">
              Direct, human spoken cadence for Trace Galaxy sales calls or CMO brief intake.
            </p>
            <div className="voice-segmented" role="group" aria-label="Voice persona presets">
              <button
                type="button"
                className={
                  personaId === "trace_galaxy_founder"
                    ? "voice-seg-btn is-active"
                    : "voice-seg-btn"
                }
                onClick={() => onSelectPersona("trace_galaxy_founder")}
              >
                Trace Galaxy
              </button>
              <button
                type="button"
                className={
                  personaId === "luxor9_cmo_intake"
                    ? "voice-seg-btn is-active"
                    : "voice-seg-btn"
                }
                onClick={() => onSelectPersona("luxor9_cmo_intake")}
              >
                CMO Intake
              </button>
              <button
                type="button"
                className={personaId === "custom" ? "voice-seg-btn is-active" : "voice-seg-btn"}
                onClick={() => onSelectPersona("custom")}
              >
                Custom
              </button>
            </div>
            <label htmlFor="voice-system-prompt" className="voice-label">
              Active system prompt
            </label>
            <textarea
              id="voice-system-prompt"
              rows={6}
              value={systemPrompt}
              onChange={(e) => {
                setPersonaId("custom");
                setSystemPrompt(e.target.value);
              }}
              className="voice-textarea"
            />
          </div>

          <div className="panel voice-panel">
            <h2>Self-Hosted Parity Reference</h2>
            <p className="muted voice-sub">
              Local open-source deployment targets (Silero VAD · aiortc WebRTC · XTTS v2).
            </p>
            <table className="voice-ref-table">
              <thead>
                <tr>
                  <th>Profile</th>
                  <th>Stack</th>
                  <th>Compute</th>
                  <th>Latency</th>
                </tr>
              </thead>
              <tbody>
                {LOCAL_STACK_NOTES.map((row) => (
                  <tr key={row.tier}>
                    <td>{row.tier}</td>
                    <td>{row.stack}</td>
                    <td className="voice-mono">{row.footprint}</td>
                    <td className="voice-mono">{row.latency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </aside>
      </div>
    </section>
  );
}
