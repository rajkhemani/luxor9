import { describe, expect, it } from "vitest";
import { assertNoForbiddenVisibleCopy } from "../lib/luxor-brand";
import {
  FAQ_ITEMS,
  HERO_COPY,
  PRODUCT_SURFACES,
  ROUTE_STATES,
  allMarketingVisibleText,
} from "../lib/marketing-copy";

describe("marketing landing copy", () => {
  it("keeps all marketing strings free of forbidden vendor terms", () => {
    const hits = assertNoForbiddenVisibleCopy(allMarketingVisibleText());
    expect(hits).toEqual([]);
  });

  it("locks doctrine headline and six route states", () => {
    expect(HERO_COPY.headline).toContain("Prove every outcome");
    expect(ROUTE_STATES).toHaveLength(6);
    expect(ROUTE_STATES[0]?.title).toBe("FRAGMENTED");
    expect(ROUTE_STATES[5]?.title).toBe("RECORDED");
  });

  it("deep-links product surfaces into the live stack", () => {
    expect(PRODUCT_SURFACES.find((s) => s.id === "command")?.href).toBe("/command");
    expect(PRODUCT_SURFACES.find((s) => s.id === "tower")?.href).toBe("/");
    expect(PRODUCT_SURFACES.find((s) => s.id === "stack")?.href).toBe("/stack");
    expect(FAQ_ITEMS.length).toBeGreaterThanOrEqual(5);
  });
});
