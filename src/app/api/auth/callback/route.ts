import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  STATE_COOKIE,
  encodeSession,
  exchangeCode,
  fetchDiscordUser,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const store = await cookies();
  const [savedState, next] = (store.get(STATE_COOKIE)?.value ?? "").split("|");
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/orders";

  const fail = (reason: string) => {
    const response = NextResponse.redirect(new URL(`/login?error=${reason}`, request.url));
    response.cookies.delete(STATE_COOKIE);
    return response;
  };

  if (!code || !state || !savedState || state !== savedState) return fail("state");
  if (url.searchParams.get("error")) return fail("discord");

  const token = await exchangeCode(code);
  if (!token) return fail("token");

  const user = await fetchDiscordUser(token.access_token);
  if (!user) return fail("user");

  const response = NextResponse.redirect(new URL(target, request.url));
  response.cookies.set(SESSION_COOKIE, encodeSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  response.cookies.delete(STATE_COOKIE);

  return response;
}
