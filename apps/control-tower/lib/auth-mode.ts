/** Whether Control Tower should use Clerk instead of local demo auth. */
export function isClerkEnabled(): boolean {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return Boolean(key && key.startsWith("pk_"));
}

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Explicit local demo bypass — never enable in production builds.
 * Production without Clerk is a misconfiguration (fail closed).
 */
export function allowDemoAuthHeader(): boolean {
  if (isProductionRuntime()) return false;
  if (isClerkEnabled()) return false;
  return true;
}

/** Production must configure Clerk; used by middleware and paid routes. */
export function requireClerkInProduction(): boolean {
  return isProductionRuntime() && !isClerkEnabled();
}
