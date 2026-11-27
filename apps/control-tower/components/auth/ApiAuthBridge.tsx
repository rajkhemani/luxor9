"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, type ReactNode } from "react";
import { setApiTokenGetter } from "@/lib/api";
import { isClerkEnabled } from "@/lib/auth-mode";

function ClerkTokenBridge() {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    setApiTokenGetter(async () => getToken());
    return () => setApiTokenGetter(undefined);
  }, [getToken, isSignedIn]);

  return null;
}

/** Registers Clerk getToken with the shared API client when Clerk is enabled. */
export function ApiAuthBridge(): ReactNode {
  if (!isClerkEnabled()) return null;
  return <ClerkTokenBridge />;
}
