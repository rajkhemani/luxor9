import { describe, expect, it } from "vitest";
import {
  BRAND_ARCHITECTURE,
  BRAND_COLORS,
  BRAND_ESSENCE,
  COPY_SPECIMENS,
  EXECUTION_STATES,
  LOGO_VARIANTS,
  MOTION_SCENARIOS,
  POSITIONING_EVALUATION,
  VOICE_AGENT_PROFILES,
  buildLuxorLogoSvg,
  formatRgb,
  generateCssTokens,
  generateJsonTokens,
  hexToCmyk,
  hexToHsl,
  wcagContrastRatio,
  wcagGrade,
} from "../lib/brand-kit";
import { BRAND_SOUND_SPECS } from "../lib/brand-audio";
import { assertNoForbiddenVisibleCopy } from "../lib/luxor-brand";

describe("LUXOR9 Global Brand Identity & Brand Kit invariants", () => {
  it("computes accurate RGB, HSL, CMYK, and WCAG contrast ratios for primary brand colors", () => {
    expect(formatRgb("#0B0D10")).toBe("rgb(11, 13, 16)");
    expect(hexToHsl("#0B0D10")).toBe("hsl(216, 19%, 5%)");
    expect(hexToCmyk("#0B0D10")).toContain("/ 94");

    const obsidianIvoryRatio = wcagContrastRatio("#0B0D10", "#F3EFE6");
    expect(obsidianIvoryRatio).toBeGreaterThan(15);
    expect(wcagGrade(obsidianIvoryRatio)).toBe("AAA");

    const obsidianCyanRatio = wcagContrastRatio("#0B0D10", "#2EC4B6");
    expect(obsidianCyanRatio).toBeGreaterThan(8.9);
    expect(wcagGrade(obsidianCyanRatio)).toBe("AAA");

    const ivoryDeepTealRatio = wcagContrastRatio("#F3EFE6", "#0F766E");
    expect(ivoryDeepTealRatio).toBeGreaterThan(4.5);
    expect(wcagGrade(ivoryDeepTealRatio)).toBe("AA");
  });

  it("defines all 17 distinct brand essence dimensions and 8 architecture entities", () => {
    expect(BRAND_ESSENCE).toHaveLength(17);
    const statements = new Set(BRAND_ESSENCE.map((e) => e.statement));
    expect(statements.size).toBe(17);

    expect(BRAND_ARCHITECTURE).toHaveLength(8);
    const hermes = BRAND_ARCHITECTURE.find((e) => e.name === "HERMES OS");
    expect(hermes?.publicFacing).toBe(false);
    expect(POSITIONING_EVALUATION.length).toBeGreaterThanOrEqual(7);
  });

  it("includes all 20 logo variants and generates valid vector SVG exports", () => {
    expect(LOGO_VARIANTS).toHaveLength(20);
    const svgDark = buildLuxorLogoSvg("primary-dark");
    const svgSymbol = buildLuxorLogoSvg("symbol-only");
    expect(svgDark).toContain("<svg");
    expect(svgDark).toContain("LUXOR");
    expect(svgDark).toContain("#2EC4B6");
    expect(svgSymbol).toContain("viewBox=\"0 0 96 96\"");
  });

  it("defines all 9 non-color-only execution states, 6 specialist voice profiles, 8 motion patterns, and 8 sound cues", () => {
    expect(EXECUTION_STATES).toHaveLength(9);
    for (const s of EXECUTION_STATES) {
      expect(s.glyph.length).toBeGreaterThan(0);
      expect(s.label.length).toBeGreaterThan(0);
    }

    expect(VOICE_AGENT_PROFILES).toHaveLength(6);
    expect(MOTION_SCENARIOS).toHaveLength(8);
    expect(BRAND_SOUND_SPECS).toHaveLength(8);
    expect(BRAND_COLORS.length).toBeGreaterThanOrEqual(16);
  });

  it("exports valid CSS & JSON tokens and contains zero forbidden vendor names in public copy", () => {
    const css = generateCssTokens();
    expect(css).toContain("--lx-obsidian: #0B0D10;");
    expect(css).toContain("--lx-mineral-ivory: #F3EFE6;");
    expect(css).toContain("--lx-signal-cyan: #2EC4B6;");

    const parsed = JSON.parse(generateJsonTokens()) as { brand: string; legalEntity: string };
    expect(parsed.brand).toBe("LUXOR9");
    expect(parsed.legalEntity).toBe("Luxoranova Fintech Private Limited");

    const allCopy = [
      ...BRAND_ESSENCE.map((e) => e.statement),
      ...COPY_SPECIMENS.map((c) => c.copy),
      ...VOICE_AGENT_PROFILES.map((v) => v.sampleUtterance),
    ].join("\n");
    expect(assertNoForbiddenVisibleCopy(allCopy)).toEqual([]);
  });
});
