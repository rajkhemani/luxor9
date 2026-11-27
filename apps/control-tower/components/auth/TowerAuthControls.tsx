"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { isClerkEnabled } from "@/lib/auth-mode";

export function TowerAuthControls() {
  if (!isClerkEnabled()) {
    return <span className="auth-demo-pill">Demo auth</span>;
  }

  return (
    <div className="tower-auth-controls">
      <SignedOut>
        <SignInButton mode="modal">
          <button type="button" className="auth-sign-in">
            Sign in
          </button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/home" />
      </SignedIn>
    </div>
  );
}
