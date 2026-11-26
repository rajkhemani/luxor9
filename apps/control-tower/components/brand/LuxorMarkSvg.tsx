"use client";

import React from "react";
import type { LogoVariantSpec } from "@/lib/brand-kit";

/**
 * The Governed Keystone — LUXOR9 Master Symbol
 * Built on a 9X architectural proportion grid (viewBox 0 0 56 56, outer frame 4..52 = 48u, stroke 6u = 1X).
 * Combines structural L-foundation and precision 9-chamber aperture bisected by the Signal Meridian.
 */
export function LuxorKeystoneGlyph({
  fg = "#F3EFE6",
  accent = "#2EC4B6",
  size = 32,
  thickened = false,
}: {
  fg?: string;
  accent?: string;
  size?: number;
  thickened?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      {thickened ? (
        <>
          <path d="M3 3H53V37H19V19H41V12H12V44H53V53H3V3Z" fill={fg} />
          <rect x="34" y="23" width="19" height="8" fill={accent} />
        </>
      ) : (
        <>
          <path d="M4 4H52V36H20V20H40V14H14V42H52V52H4V4Z" fill={fg} />
          <rect x="36" y="24" width="16" height="6" fill={accent} />
        </>
      )}
    </svg>
  );
}

/**
 * Renders any of the 20 official logo variants on its intended specimen background.
 */
export function LogoVariantPreview({ spec }: { spec: LogoVariantSpec }) {
  const isLight = spec.surface === "light";
  const isMetallic = spec.surface === "metallic";

  const fg = isMetallic
    ? "#949BA6"
    : spec.variantKind === "one-color"
      ? "#000000"
      : spec.variantKind === "mono-dark"
        ? "#0B0D10"
        : spec.variantKind === "watermark"
          ? "rgba(11, 13, 16, 0.22)"
          : isLight
            ? "#0B0D10"
            : "#F3EFE6";

  const accent = isMetallic
    ? "#B5BCC7"
    : spec.variantKind === "one-color"
      ? "#000000"
      : spec.variantKind === "mono-dark"
        ? "#0B0D10"
        : spec.variantKind === "reversed"
          ? "#F3EFE6"
          : spec.variantKind === "watermark"
            ? "rgba(11, 13, 16, 0.22)"
            : isLight
              ? "#0F766E"
              : "#2EC4B6";

  const wordStyle: React.CSSProperties = {
    fontFamily: "var(--font-jakarta), sans-serif",
    fontWeight: 600,
    letterSpacing: "0.18em",
    color: fg,
    lineHeight: 1,
    whiteSpace: "nowrap",
  };

  switch (spec.variantKind) {
    case "symbol":
      return <LuxorKeystoneGlyph fg={fg} accent={accent} size={52} />;

    case "monogram":
      return (
        <div
          style={{
            width: 58,
            height: 58,
            border: `1.5px solid ${fg}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-jakarta), sans-serif",
            fontWeight: 700,
            fontSize: "1.35rem",
            letterSpacing: "0.06em",
            color: fg,
          }}
        >
          L<span style={{ color: accent }}>9</span>
        </div>
      );

    case "wordmark":
      return (
        <span style={{ ...wordStyle, fontSize: "1.45rem" }}>
          LUXOR<span style={{ color: accent, fontWeight: 700 }}>9</span>
        </span>
      );

    case "vertical":
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <LuxorKeystoneGlyph fg={fg} accent={accent} size={38} />
          <span style={{ ...wordStyle, fontSize: "1.1rem" }}>
            LUXOR<span style={{ color: accent, fontWeight: 700 }}>9</span>
          </span>
        </div>
      );

    case "compact":
      return (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <LuxorKeystoneGlyph fg={fg} accent={accent} size={22} thickened />
          <span style={{ ...wordStyle, fontSize: "0.95rem", letterSpacing: "0.14em" }}>
            LUXOR<span style={{ color: accent, fontWeight: 700 }}>9</span>
          </span>
        </div>
      );

    case "endorsement":
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <LuxorKeystoneGlyph fg={fg} accent={accent} size={26} />
            <span style={{ ...wordStyle, fontSize: "1.15rem" }}>
              LUXOR<span style={{ color: accent, fontWeight: 700 }}>9</span>
            </span>
          </div>
          <span
            style={{
              fontSize: "0.68rem",
              letterSpacing: "0.08em",
              color: "#525866",
              fontFamily: "var(--font-jakarta), sans-serif",
            }}
          >
            BY LUXORANOVA FINTECH PRIVATE LIMITED
          </span>
        </div>
      );

    case "product-tower":
    case "product-generalist": {
      const sub = spec.variantKind === "product-tower" ? "CONTROL TOWER" : "AI GENERALIST";
      return (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "nowrap",
            maxWidth: "100%",
          }}
        >
          <LuxorKeystoneGlyph fg={fg} accent={accent} size={20} thickened />
          <span style={{ ...wordStyle, fontSize: "0.86rem", letterSpacing: "0.14em" }}>
            LUXOR<span style={{ color: accent, fontWeight: 700 }}>9</span>
          </span>
          <span
            style={{
              width: 1,
              height: 15,
              flexShrink: 0,
              background: isLight ? "#B8AEA0" : "#384252",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-jakarta), sans-serif",
              fontSize: "0.66rem",
              fontWeight: 500,
              letterSpacing: "0.11em",
              color: isLight ? "#333B48" : "#C6CDD8",
              whiteSpace: "nowrap",
            }}
          >
            {sub}
          </span>
        </div>
      );
    }

    case "small-ui":
      return (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <LuxorKeystoneGlyph fg={fg} accent={accent} size={18} thickened />
          <span style={{ ...wordStyle, fontSize: "0.78rem", letterSpacing: "0.12em" }}>
            LUXOR<span style={{ color: accent, fontWeight: 700 }}>9</span>
          </span>
        </div>
      );

    case "favicon":
      return (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: "#0B0D10",
            border: "1px solid #2C3544",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LuxorKeystoneGlyph fg="#F3EFE6" accent="#2EC4B6" size={20} thickened />
        </div>
      );

    case "app-icon":
      return (
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 15,
            background: "linear-gradient(145deg, #161B24 0%, #0B0D10 100%)",
            border: "1px solid rgba(243,239,230,0.16)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 10px 24px -10px rgba(0,0,0,0.65)",
          }}
        >
          <LuxorKeystoneGlyph fg="#F3EFE6" accent="#2EC4B6" size={34} />
        </div>
      );

    case "social-avatar":
      return (
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#0B0D10",
            border: "1px solid #2EC4B6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LuxorKeystoneGlyph fg="#F3EFE6" accent="#2EC4B6" size={30} />
        </div>
      );

    case "embossed":
      return (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            filter: "drop-shadow(0 1px 0 rgba(255,255,255,0.22)) drop-shadow(0 -1px 0 rgba(0,0,0,0.55))",
          }}
        >
          <LuxorKeystoneGlyph fg="#7A828E" accent="#9AA3B0" size={30} />
          <span style={{ ...wordStyle, fontSize: "1.25rem", color: "#8B93A0" }}>LUXOR9</span>
        </div>
      );

    default:
      return (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
          <LuxorKeystoneGlyph fg={fg} accent={accent} size={32} />
          <span style={{ ...wordStyle, fontSize: "1.3rem" }}>
            LUXOR<span style={{ color: accent, fontWeight: 700 }}>9</span>
          </span>
        </div>
      );
  }
}

/**
 * Microscopic Engineering & X-Unit Construction Blueprint
 */
export function LogoConstructionBlueprint({
  showGrid,
  showClearSpace,
  showKerning,
}: {
  showGrid: boolean;
  showClearSpace: boolean;
  showKerning: boolean;
}) {
  return (
    <svg
      viewBox="0 0 760 280"
      width="100%"
      role="img"
      aria-label="LUXOR9 X-Unit logo construction blueprint and clear space specification"
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      <rect width="760" height="280" fill="#0E1218" />

      {/* Construction Grid (X = 12px) */}
      {showGrid && (
        <g stroke="rgba(152,162,179,0.14)" strokeWidth="1">
          {Array.from({ length: 39 }).map((_, i) => (
            <line key={`v-${i}`} x1={i * 20} y1={0} x2={i * 20} y2={280} />
          ))}
          {Array.from({ length: 15 }).map((_, i) => (
            <line key={`h-${i}`} x1={0} y1={i * 20} x2={760} y2={i * 20} />
          ))}
        </g>
      )}

      {/* 2X Safe-Area Clear Space Boundary */}
      {showClearSpace && (
        <g>
          <rect
            x="80"
            y="40"
            width="600"
            height="200"
            fill="rgba(46,196,182,0.04)"
            stroke="#2EC4B6"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <rect
            x="128"
            y="88"
            width="504"
            height="104"
            fill="none"
            stroke="rgba(243,239,230,0.28)"
            strokeWidth="1"
          />
          {/* Clear space dimension markers */}
          <text x="96" y="68" fill="#2EC4B6" fontSize="11" fontFamily="var(--font-jetbrains), monospace">
            2X CLEAR SPACE (MIN)
          </text>
          <line x1="80" y1="140" x2="128" y2="140" stroke="#2EC4B6" strokeWidth="1" />
          <text x="95" y="133" fill="#2EC4B6" fontSize="11" fontFamily="var(--font-jetbrains), monospace">
            2X
          </text>
          <line x1="632" y1="140" x2="680" y2="140" stroke="#2EC4B6" strokeWidth="1" />
          <text x="649" y="133" fill="#2EC4B6" fontSize="11" fontFamily="var(--font-jetbrains), monospace">
            2X
          </text>
        </g>
      )}

      {/* Symbol Construction (Height = 9X = 96px, Stroke = 1X = 10.66px) */}
      <g transform="translate(132, 92)">
        <path
          d="M0 0H96V64H32V32H72V20H20V76H96V96H0V0Z"
          fill="#F3EFE6"
        />
        <rect x="64" y="40" width="32" height="12" fill="#2EC4B6" />
        {/* Height & Stroke callout */}
        {showGrid && (
          <>
            <line x1="-14" y1="0" x2="-14" y2="96" stroke="#C4A574" strokeWidth="1" />
            <text x="-38" y="52" fill="#C4A574" fontSize="11" fontFamily="var(--font-jetbrains), monospace">
              9X
            </text>
            <line x1="0" y1="110" x2="96" y2="110" stroke="#C4A574" strokeWidth="1" />
            <text x="40" y="124" fill="#C4A574" fontSize="11" fontFamily="var(--font-jetbrains), monospace">
              9X
            </text>
          </>
        )}
      </g>

      {/* Symbol-to-Wordmark Gap = 3.5X (42px) */}
      {showKerning && (
        <g>
          <rect x="228" y="92" width="44" height="96" fill="rgba(196,165,116,0.12)" />
          <text x="237" y="84" fill="#C4A574" fontSize="10" fontFamily="var(--font-jetbrains), monospace">
            3.5X
          </text>
          {/* Baseline & Cap-Height Rules */}
          <line x1="272" y1="114" x2="628" y2="114" stroke="rgba(46,196,182,0.45)" strokeWidth="1" strokeDasharray="2 3" />
          <line x1="272" y1="168" x2="628" y2="168" stroke="rgba(46,196,182,0.45)" strokeWidth="1" strokeDasharray="2 3" />
          <text x="515" y="106" fill="#2EC4B6" fontSize="10" fontFamily="var(--font-jetbrains), monospace">
            CAP HEIGHT = 5.2X
          </text>
          <text x="505" y="184" fill="#98A2B3" fontSize="10" fontFamily="var(--font-jetbrains), monospace">
            OPTICAL TRACK +180
          </text>
        </g>
      )}

      {/* Primary Wordmark */}
      <text
        x="276"
        y="167"
        fill="#F3EFE6"
        fontFamily="var(--font-jakarta), Helvetica, Arial, sans-serif"
        fontSize="74"
        fontWeight="600"
        letterSpacing="12"
      >
        LUXOR
      </text>
      <text
        x="576"
        y="167"
        fill="#2EC4B6"
        fontFamily="var(--font-jakarta), Helvetica, Arial, sans-serif"
        fontSize="74"
        fontWeight="700"
      >
        9
      </text>
    </svg>
  );
}

/**
 * Unified 16-Icon Enterprise Iconography System
 * 24×24 grid · 1.5px stroke · crisp 1px architectural joins · single visual family
 */
export const ENTERPRISE_ICONS: Array<{
  id: string;
  label: string;
  category: string;
  paths: React.ReactNode;
}> = [
  { id: "control-tower", label: "Control Tower", category: "Navigation", paths: <><rect x="4" y="4" width="16" height="16" /><path d="M4 10H20M10 10V20" /></> },
  { id: "workflow", label: "Workflow Graph", category: "Navigation", paths: <><rect x="3" y="4" width="6" height="5" /><rect x="15" y="4" width="6" height="5" /><rect x="9" y="15" width="6" height="5" /><path d="M6 9V12H18V9M12 12V15" /></> },
  { id: "approval-gate", label: "Approval Gate", category: "Governance", paths: <><path d="M12 3L20 7V13C20 17.5 16.5 20 12 21C7.5 20 4 17.5 4 13V7L12 3Z" /><path d="M9 12L11 14L15 10" /></> },
  { id: "evidence", label: "Evidence Receipt", category: "Governance", paths: <><path d="M6 3H18V21L15 19L12 21L9 19L6 21V3Z" /><path d="M9 8H15M9 12H15M9 16H12" /></> },
  { id: "audit-ledger", label: "Audit Ledger", category: "Governance", paths: <><rect x="4" y="3" width="16" height="18" /><path d="M8 3V21M11 8H17M11 12H17M11 16H15" /></> },
  { id: "workforce", label: "Agent Workforce", category: "Workforce", paths: <><rect x="9" y="3" width="6" height="6" /><rect x="3" y="15" width="6" height="6" /><rect x="15" y="15" width="6" height="6" /><path d="M12 9V12M6 15V12H18V15" /></> },
  { id: "voice-mic", label: "Voice Session", category: "Voice", paths: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11A7 7 0 0 0 19 11M12 18V21M9 21H15" /></> },
  { id: "barge-in", label: "Interrupt / Barge-In", category: "Voice", paths: <><path d="M4 12H7M17 12H20M9 7V17M15 7V17" /><rect x="10.5" y="9" width="3" height="6" /></> },
  { id: "verified", label: "Verified State", category: "Status", paths: <><circle cx="12" cy="12" r="9" /><path d="M8.5 12.2L10.8 14.5L15.8 9.5" /></> },
  { id: "pending", label: "Pending Approval", category: "Status", paths: <><path d="M12 3L21 12L12 21L3 12L12 3Z" /><path d="M12 8V12.5L15 14" /></> },
  { id: "missing-source", label: "Source Needed", category: "Status", paths: <><path d="M12 4L21 19H3L12 4Z" /><path d="M12 10V14M12 16.8V17.2" /></> },
  { id: "safe-halt", label: "Execution Halt", category: "Status", paths: <><rect x="4" y="4" width="16" height="16" /><path d="M9 9L15 15M15 9L9 15" /></> },
  { id: "knowledge", label: "Verified Sources", category: "Enterprise", paths: <><path d="M4 6L12 3L20 6V18L12 21L4 18V6Z" /><path d="M12 3V21M4 6L12 9L20 6" /></> },
  { id: "delegation", label: "Task Delegation", category: "Enterprise", paths: <><path d="M4 7H16M13 4L16 7L13 10M20 17H8M11 14L8 17L11 20" /></> },
  { id: "policy-lock", label: "Tenant Policy", category: "Enterprise", paths: <><rect x="5" y="11" width="14" height="10" /><path d="M8 11V7A4 4 0 0 1 16 7V11M12 15V17" /></> },
  { id: "metrics", label: "Outcome Telemetry", category: "Enterprise", paths: <><path d="M4 20H20M6 16V11M12 16V7M18 16V4" /></> },
];
