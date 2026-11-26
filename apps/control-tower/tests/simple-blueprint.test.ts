import { describe, expect, it } from "vitest";
import {
  JARGON_FORBIDDEN_WORDS,
  buildProofRecord,
  buildSimpleBlueprint,
  detectMissingSources,
} from "../lib/simple-blueprint";

describe("simple-blueprint engine", () => {
  it("produces the exact Dubai launch demo blueprint with verified source and pricing", () => {
    const bp = buildSimpleBlueprint("Launch my new project");
    expect(bp.project).toBe("Example Launch in Dubai");
    expect(bp.problem).toBe("Launch campaign is late");
    expect(bp.solutionSteps).toEqual([
      "Make brochure text",
      "Make 10 posts",
      "Make follow up messages",
    ]);
    expect(bp.buildList).toEqual(["Brochure", "Posts", "Follow up"]);
    expect(bp.timeLabel).toBe("Ready in 3 days");
    expect(bp.pricing.perLaunch).toBe("AED 2,500 per launch");
    expect(bp.pricing.monthlyTower).toBe("AED 1,500 per month");
    expect(bp.sourceLabel).toBe("Provided by developer");
    expect(bp.missingSource).toBe(false);
  });

  it("handles site visit lead follow-up and brochure/posts quick examples cleanly", () => {
    const leads = buildSimpleBlueprint("Follow up my site visit leads");
    expect(leads.missingSource).toBe(false);
    expect(leads.solutionSteps).toHaveLength(3);
    expect(leads.buildList).toHaveLength(3);

    const brochure = buildSimpleBlueprint("Create brochure and posts");
    expect(brochure.missingSource).toBe(false);
    expect(brochure.solutionSteps).toHaveLength(3);
    expect(brochure.buildList).toHaveLength(3);
  });

  it("enforces the hallucination rule when price, handover date, or offer lacks a source", () => {
    const check = detectMissingSources(
      "Create a brochure with possession date, starting price, and payment plan offer for our tower",
    );
    expect(check.missingSource).toBe(true);
    expect(check.missingItems).toContain("unit price");
    expect(check.missingItems).toContain("handover / possession date");
    expect(check.missingItems).toContain("offer / payment plan");

    const bp = buildSimpleBlueprint(
      "Create a brochure with possession date and payment plan offer for our tower",
    );
    expect(bp.missingSource).toBe(true);
    expect(bp.sourceLabel).toBe("Source needed. Please give source.");
  });

  it("clears missing source once the developer supplies an explicit source via change flow", () => {
    const initial = buildSimpleBlueprint(
      "Need brochure with handover date and payment plan offer",
    );
    expect(initial.missingSource).toBe(true);

    const updated = buildSimpleBlueprint(
      "Source: Developer RERA brochure PDF — handover Q4 2027, 60/40 payment plan, Dubai Marina",
      initial,
    );
    expect(updated.missingSource).toBe(false);
    expect(updated.sourceLabel).toBe("Provided by developer");
    expect(updated.project).toContain("Dubai Marina");
    expect(updated.revisionCount).toBe(2);
  });

  it("builds a complete timestamped Proof Record with zero technical jargon", () => {
    const bp = buildSimpleBlueprint("Launch my new project");
    const proof = buildProofRecord(bp, "wf_cmo_009", "2026-11-22T18:30:00.000Z");

    expect(proof.proofId).toMatch(/^PROOF-/);
    expect(proof.approvedBuildList).toEqual(["Brochure", "Posts", "Follow up"]);
    expect(proof.buildingNow).toHaveLength(3);

    const combinedText = JSON.stringify({ bp, proof }).toLowerCase();
    for (const term of JARGON_FORBIDDEN_WORDS) {
      expect(combinedText).not.toContain(term);
    }
  });
});
