import { afterEach, describe, expect, it } from "vitest";
import { buildAuthHeaders } from "../lib/auth-headers";

describe("buildAuthHeaders", () => {
  const prevKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  afterEach(() => {
    if (prevKey === undefined) delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    else process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = prevKey;
  });

  it("prefers bearer token from getToken", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_example";
    const headers = await buildAuthHeaders(async () => "jwt-token");
    expect(headers).toEqual({ Authorization: "Bearer jwt-token" });
  });

  it("falls back to demo header when Clerk is unset", async () => {
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const headers = await buildAuthHeaders();
    expect(headers).toEqual({ "X-Demo-User": "user_demo_admin" });
  });

  it("does not send demo header when Clerk is configured but token missing", async () => {
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_example";
    const headers = await buildAuthHeaders(async () => null);
    expect(headers).toEqual({});
  });
});
