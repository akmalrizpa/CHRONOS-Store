import type { BotCategory, BotGuild, BotHealth, BotProduct } from "./types";

/**
 * Server-only client for the bot's DASH API (src/infra/dashServer.js in
 * CHRONOS-bot). The token stays on the server — it must never reach the browser,
 * and every route except /health and /transcripts/:id requires it.
 */

const BASE = (process.env.DASH_API_URL ?? "").replace(/\/+$/, "");
const TOKEN = process.env.DASH_API_TOKEN ?? "";

export const GUILD_ID = process.env.CHRONOS_GUILD_ID ?? "";
export const hasBotUrl = Boolean(BASE);
export const isBotConfigured = Boolean(BASE && TOKEN && GUILD_ID);

export type BotResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function dashFetch<T>(path: string, init?: RequestInit): Promise<BotResult<T>> {
  if (!BASE) return { ok: false, error: "DASH_API_URL is not set" };

  try {
    const response = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(TOKEN ? { "x-dash-token": TOKEN } : {}),
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    const text = await response.text();
    let body: unknown = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }

    if (!response.ok) {
      const message =
        body && typeof body === "object" && "error" in body
          ? String((body as { error: unknown }).error)
          : `bot API answered HTTP ${response.status}`;
      return { ok: false, error: message };
    }

    return { ok: true, data: body as T };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "request to the bot failed" };
  }
}

export type DashboardPayload = {
  guild: BotGuild | null;
  config: {
    products?: BotProduct[];
    ticketCategories?: BotCategory[];
  };
};

export function fetchDashboard() {
  if (!GUILD_ID) return Promise.resolve<BotResult<DashboardPayload>>({ ok: false, error: "CHRONOS_GUILD_ID is not set" });
  return dashFetch<DashboardPayload>(`/guilds/${GUILD_ID}/dashboard`);
}

export function fetchHealth() {
  return dashFetch<BotHealth>("/health");
}

export type DeliverResult = {
  ok: boolean;
  key?: { key: string; expireAt: number | null };
  productMode?: boolean;
  roleGranted?: boolean;
  dmSent?: boolean;
  invoiceSent?: boolean;
  schedule?: { permanent: boolean; expireAt: number | null; extended: boolean };
  warning?: string;
};

/**
 * Hands a key to the bot in product mode: it stores the key, grants the
 * product's auto-role, schedules the auto-expire, DMs the buyer, writes the
 * invoice and records the purchase — the same flow as /set-key.
 */
export function deliverKey(input: { userId: string; key: string; productValue: string; actorId?: string }) {
  if (!GUILD_ID) {
    return Promise.resolve<BotResult<DeliverResult>>({ ok: false, error: "CHRONOS_GUILD_ID is not set" });
  }

  return dashFetch<DeliverResult>(`/guilds/${GUILD_ID}/keys`, {
    method: "POST",
    body: JSON.stringify({
      userId: input.userId,
      key: input.key,
      value: input.productValue,
      actor: input.actorId ? { id: input.actorId } : undefined,
    }),
  });
}

export function isGuildMember(userId: string) {
  return dashFetch<{ id?: string; username?: string }>(`/guilds/${GUILD_ID}/member/${userId}`);
}
