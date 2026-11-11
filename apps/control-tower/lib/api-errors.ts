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
