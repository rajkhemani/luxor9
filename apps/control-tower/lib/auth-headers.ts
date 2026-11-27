import { allowDemoAuthHeader } from "./auth-mode";

export type TokenGetter = () => Promise<string | null>;

/**
 * Build API auth headers.
 * Prefer Clerk Bearer tokens; fall back to demo header only when Clerk is unset.
 */
export async function buildAuthHeaders(getToken?: TokenGetter): Promise<Record<string, string>> {
  if (getToken) {
    const token = await getToken();
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  }
  if (allowDemoAuthHeader()) {
    return { "X-Demo-User": "user_demo_admin" };
  }
  return {};
}
