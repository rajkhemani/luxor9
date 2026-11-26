"use client";

import { useEffect, useRef } from "react";

type VoiceWaveMeterProps = {
  history: number[];
  threshold: number;
  isLive: boolean;
  stateLabel: string;
};

/**
 * Renders the live VAD speech-probability history bars against the active
 * interruption threshold line. Redraws only when inputs change (no idle spin).
 */
export function VoiceWaveMeter({
  history,
  threshold,
  isLive,
  stateLabel,
}: VoiceWaveMeterProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#0b0d10";
    ctx.fillRect(0, 0, width, height);

    // Subtle baseline grid lines
    ctx.strokeStyle = "rgba(139, 147, 167, 0.14)";
    ctx.lineWidth = 1;
    for (const frac of [0.25, 0.5, 0.75]) {
      const y = Math.round(height * (1 - frac)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Speech probability bars
    const slots = 48;
    const barGap = 4;
    const barWidth = Math.max(4, Math.floor((width - barGap * (slots + 1)) / slots));
    const startIdx = Math.max(0, history.length - slots);

    for (let i = 0; i < slots; i += 1) {
      const val = history[startIdx + i] ?? 0;
      const clamped = Math.max(0.02, Math.min(1, val));
      const barH = Math.max(2, Math.round(clamped * (height - 12)));
      const x = barGap + i * (barWidth + barGap);
      const y = height - barH - 4;

      if (val >= threshold) {
        ctx.fillStyle = "#2ec4b6";
      } else if (isLive) {
        ctx.fillStyle = "rgba(139, 147, 167, 0.45)";
      } else {
        ctx.fillStyle = "rgba(139, 147, 167, 0.2)";
      }
      ctx.fillRect(x, y, barWidth, barH);
    }

    // Active VAD threshold line (copper hairline)
    const thresholdY = Math.round((1 - threshold) * (height - 12)) + 4.5;
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = "#c4a574";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, thresholdY);
    ctx.lineTo(width, thresholdY);
    ctx.stroke();
    ctx.restore();
  }, [history, threshold, isLive]);

  return (
    <div className="voice-meter-wrap" data-testid="voice-vad-meter">
      <div className="voice-meter-meta">
        <span>VAD Speech Probability</span>
        <span className="voice-mono">
          {stateLabel} · Threshold {threshold.toFixed(2)}
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={640}
        height={84}
        className="voice-meter-canvas"
        aria-label={`Voice activity level meter. State: ${stateLabel}. Threshold: ${threshold.toFixed(2)}.`}
      />
    </div>
  );
}
