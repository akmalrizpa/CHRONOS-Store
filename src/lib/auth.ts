import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getCustomer } from "./store";
import type { StoreUser } from "./types";

/**
 * Discord OAuth2 (identify only) + a signed session cookie. The store needs the
 * buyer's Discord ID because the bot grants the role and DMs the key to that ID.
 */

export const SESSION_COOKIE = "cs_session";
export const STATE_COOKIE = "cs_state";

const DISCORD_API = "https://discord.com/api/v10";

const CLIENT_ID = process.env.DISCORD_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET ?? "";
const SESSION_SECRET = process.env.SESSION_SECRET ?? "";
const PUBLIC_ORIGIN = (process.env.PUBLIC_ORIGIN ?? "http://localhost:3000").replace(/\/+$/, "");

export const isAuthConfigured = Boolean(CLIENT_ID && CLIENT_SECRET && SESSION_SECRET);

const STAFF_IDS = (process.env.STORE_ADMIN_DISCORD_IDS ?? "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

/** IDs listed in STORE_ADMIN_DISCORD_IDS — always staff, even with an empty database. */
export function isEnvStaff(userId: string | null | undefined): boolean {
  return Boolean(userId) && STAFF_IDS.includes(String(userId));
}

/** Demo login (DEMO_MODE=true) — read-only, so it can be shown to anyone. */
export const DEMO_STAFF_ID = "demo-staff";
export const DEMO_CUSTOMER_ID = "demo-buyer";
export const DEMO_MAX_AGE = 60 * 60 * 3;

export function demoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

export function demoUser(role: "staff" | "customer"): StoreUser {
  return role === "staff"
    ? { id: DEMO_STAFF_ID, username: "demo.staff", displayName: "Demo staff", avatarUrl: null, demo: true }
    : { id: DEMO_CUSTOMER_ID, username: "demo.buyer", displayName: "Demo buyer", avatarUrl: null, demo: true };
}

export function isDemoUser(user: StoreUser | null | undefined): boolean {
  return Boolean(user?.demo);
}

/**
 * Staff = the env list OR role 'admin' on the customer row (set from
 * /admin/customers). The env list is checked first so a fresh deployment —
 * where nobody has signed in yet — can always reach the admin area.
 */
export async function isStaffUser(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  if (demoMode() && userId === DEMO_STAFF_ID) return true;
  if (isEnvStaff(userId)) return true;
  const customer = await getCustomer(String(userId));
  return customer?.role === "admin";
}

export function staffIds(): string[] {
  return STAFF_IDS;
}

export function redirectUri(): string {
  return `${PUBLIC_ORIGIN}/api/auth/callback`;
}

export function createState(): string {
  return randomBytes(16).toString("base64url");
}

export function authorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: "identify",
    state,
    prompt: "none",
  });
  return `${DISCORD_API}/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCode(code: string): Promise<{ access_token: string } | null> {
  const response = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(),
    }),
    cache: "no-store",
  });

  if (!response.ok) return null;
  return (await response.json()) as { access_token: string };
}

export async function fetchDiscordUser(accessToken: string): Promise<StoreUser | null> {
  const response = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) return null;

  const user = (await response.json()) as {
    id: string;
    username: string;
    global_name?: string | null;
    avatar?: string | null;
  };

  const avatarUrl = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${user.avatar.startsWith("a_") ? "gif" : "png"}?size=128`
    : null;

  return {
    id: user.id,
    username: user.username,
    displayName: user.global_name || user.username,
    avatarUrl,
  };
}

function sign(payload: string): string {
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("base64url");
}

export function encodeSession(user: StoreUser): string {
  const payload = Buffer.from(JSON.stringify(user), "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(value: string | undefined): StoreUser | null {
  if (!value || !SESSION_SECRET) return null;

  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const given = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) return null;

  try {
    const user = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as StoreUser;
    if (!user?.id) return null;
    return user;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<StoreUser | null> {
  const store = await cookies();
  return decodeSession(store.get(SESSION_COOKIE)?.value);
}

export async function getStaffSession(): Promise<StoreUser | null> {
  const user = await getSession();
  if (!user) return null;
  return (await isStaffUser(user.id)) ? user : null;
}

/** Session-only helper for the language switcher cookie. */
export const LOCALE_COOKIE = "cs_locale";
