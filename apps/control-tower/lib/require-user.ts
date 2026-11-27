import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isClerkEnabled } from "./auth-mode";

/** Returns an unauthorized response when Clerk is enabled and there is no session. */
export async function requireUserOrUnauthorized(): Promise<NextResponse | null> {
  if (!isClerkEnabled()) return null;
  const session = await auth();
  if (!session.userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  return null;
}
