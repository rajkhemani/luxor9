/** Whether Control Tower should use Clerk instead of local demo auth. */
export function isClerkEnabled(): boolean {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return Boolean(key && key.startsWith("pk_"));
}

/** Explicit local demo bypass — never enable in production builds with Clerk. */
export function allowDemoAuthHeader(): boolean {
  if (isClerkEnabled()) return false;
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_AUTH !== "true") {
    return false;
  }
  return true;
}
