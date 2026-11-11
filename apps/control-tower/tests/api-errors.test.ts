import { describe, expect, it } from "vitest";
import { isAuthFailureMessage } from "../lib/api-errors";

describe("api error classification", () => {
  it("treats bearer and HTTP auth failures as auth", () => {
    expect(isAuthFailureMessage('HTTP 401: {"detail":"Missing bearer token"}')).toBe(true);
    expect(isAuthFailureMessage("Demo auth is disabled outside development/tests")).toBe(true);
    expect(isAuthFailureMessage("HTTP 403: forbidden")).toBe(true);
  });

  it("does not treat transport failures as auth", () => {
    expect(isAuthFailureMessage("API unreachable at http://localhost:8000 (network error)")).toBe(
      false,
    );
  });
});
