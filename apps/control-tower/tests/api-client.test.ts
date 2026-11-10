import { describe, expect, it } from "vitest";

describe("control tower smoke", () => {
  it("defines api base fallback", () => {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    expect(base).toContain("http");
  });
});
