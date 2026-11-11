/** Shared classification for marketing live-status panels. */

export function isAuthFailureMessage(why: string): boolean {
  const lower = why.toLowerCase();
  return (
    lower.includes("401") ||
    lower.includes("403") ||
    lower.includes("unauthorized") ||
    lower.includes("missing bearer") ||
    lower.includes("bearer token") ||
    lower.includes("demo auth is disabled") ||
    lower.includes("not authenticated") ||
    lower.includes("authentication")
  );
}

export function errorMessageFromUnknown(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Short public-safe copy — never dump raw HTML/proxy bodies onto the landing page. */
export function publicStatusMessage(
  why: string,
  surface: "overview" | "agui" = "overview",
): string {
  if (isAuthFailureMessage(why)) {
    return surface === "agui"
      ? "AG-UI status requires a signed-in session."
      : "Live Tower metrics require a signed-in session.";
  }
  const lower = why.toLowerCase();
  if (lower.includes("fetch") || lower.includes("network") || lower.includes("unreachable")) {
    return "API unreachable. Start the API or check NEXT_PUBLIC_API_BASE_URL.";
  }
  if (lower.includes("502") || lower.includes("503") || lower.includes("504")) {
    return surface === "agui"
      ? "AG-UI status temporarily unavailable."
      : "Overview temporarily unavailable.";
  }
  return surface === "agui" ? "AG-UI status unavailable." : "Overview unavailable.";
}
