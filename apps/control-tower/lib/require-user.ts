import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isClerkEnabled, requireClerkInProduction } from "./auth-mode";

/** Returns an unauthorized response when auth is required and missing. */
export async function requireUserOrUnauthorized(): Promise<NextResponse | null> {
  if (requireClerkInProduction()) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required in production" },
      { status: 503 },
    );
  }
  if (!isClerkEnabled()) return null;
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  return null;
}
