import { NextResponse } from "next/server";
import { authorizeUrl, createState, isAuthConfigured, STATE_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawNext = url.searchParams.get("next") ?? "/orders";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/orders";

  if (!isAuthConfigured) {
    return NextResponse.redirect(new URL("/login?error=notconfigured", request.url));
  }

  const state = createState();
  const response = NextResponse.redirect(authorizeUrl(state));

  response.cookies.set(STATE_COOKIE, `${state}|${next}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  return response;
}
