import { NextResponse } from "next/server";
import { SESSION_COOKIE, DEMO_MAX_AGE, demoMode, demoUser, encodeSession } from "@/lib/auth";
import { logActivity } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * Read-only demo session. Only reachable when DEMO_MODE=true, and every write
 * action refuses a session with `demo: true`, so this cannot be used to release
 * keys or change the catalog.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);

  if (!demoMode()) {
    return NextResponse.redirect(new URL("/login?error=demo", request.url));
  }

  const role = url.searchParams.get("role") === "customer" ? "customer" : "staff";
  const target = url.searchParams.get("next") ?? (role === "staff" ? "/admin" : "/shop");
  const next = target.startsWith("/") && !target.startsWith("//") ? target : "/admin";

  const user = demoUser(role);
  await logActivity({
    actorId: user.id,
    actorName: user.displayName,
    action: "login",
    target: "demo",
    detail: `demo session (${role})`,
  });

  const response = NextResponse.redirect(new URL(next, request.url));
  response.cookies.set(SESSION_COOKIE, encodeSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DEMO_MAX_AGE,
  });

  return response;
}
