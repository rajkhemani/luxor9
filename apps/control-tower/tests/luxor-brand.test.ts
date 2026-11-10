import { describe, expect, it } from "vitest";
import {
  LUXOR_CAPABILITIES,
  assertNoForbiddenVisibleCopy,
} from "../lib/luxor-brand";

describe("Luxor brand surfaces", () => {
  it("exposes every capability with Luxor labels only", () => {
    expect(LUXOR_CAPABILITIES.length).toBeGreaterThanOrEqual(18);
    for (const cap of LUXOR_CAPABILITIES) {
      const hits = assertNoForbiddenVisibleCopy(`${cap.label} ${cap.blurb}`);
      expect(hits, `${cap.id} leaked ${hits.join(",")}`).toEqual([]);
    }
  });

  it("keeps Command Bridge as the live chat entry", () => {
    const bridge = LUXOR_CAPABILITIES.find((c) => c.id === "command-bridge");
    expect(bridge?.href).toBe("/command");
    expect(bridge?.status).toBe("live");
  });
});
