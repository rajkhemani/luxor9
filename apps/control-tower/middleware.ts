import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const clerkEnabled = Boolean(clerkKey && clerkKey.startsWith("pk_"));
const isProduction = process.env.NODE_ENV === "production";

const isProtectedTowerRoute = createRouteMatcher([
  "/tower(.*)",
  "/command(.*)",
  "/chat(.*)",
  "/workflows(.*)",
  "/approvals(.*)",
  "/agents(.*)",
  "/metering(.*)",
  "/atelier(.*)",
  "/stack(.*)",
  "/voice(.*)",
  "/copilot(.*)",
  "/dubai(.*)",
  "/simple(.*)",
  "/api/voice(.*)",
  "/api/copilotkit(.*)",
  "/api/v1(.*)",
]);

export default clerkEnabled
  ? clerkMiddleware(async (auth, req) => {
      if (isProtectedTowerRoute(req)) {
        await auth.protect();
      }
    })
  : function passthrough(req: NextRequest) {
      if (isProduction && isProtectedTowerRoute(req)) {
        return NextResponse.json(
          { error: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required in production" },
          { status: 503 },
        );
      }
      return NextResponse.next();
    };

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
