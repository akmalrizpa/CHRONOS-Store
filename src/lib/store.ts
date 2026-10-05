import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_SETTINGS } from "@/data/shop";
import type {
  Customer,
  CustomerRole,
  Order,
  OrderEvent,
  OrderStatus,
  ProductMeta,
  Review,
  StoreSettings,
  StoreUser,
} from "./types";

/**
 * Persistence for the store's own data (orders, reviews, promo flags, settings).
 * The product catalog is NOT stored here — it lives in the bot.
 *
 * Supabase is optional on purpose: with the env vars set the data goes to
 * Postgres + Storage, without them everything falls back to an in-memory store
 * so the site can be clicked through locally (data disappears on restart).
 */

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const hasDatabase = Boolean(SUPABASE_URL && SUPABASE_KEY);
export const PROOF_BUCKET = "proofs";

let client: SupabaseClient | null = null;

function db(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

type Memory = {
  orders: Order[];
  reviews: Review[];
  productMeta: Map<string, ProductMeta>;
  settings: Partial<StoreSettings>;
  proofs: Map<string, { bytes: ArrayBuffer; contentType: string }>;
  customers: Map<string, Customer>;
};

const globalForStore = globalThis as unknown as { __chronosStore?: Memory };

function memory(): Memory {
  if (!globalForStore.__chronosStore) {
    globalForStore.__chronosStore = {
      orders: [],
      reviews: [],
      productMeta: new Map(),
      settings: {},
      proofs: new Map(),
      customers: new Map(),
    };
  }
  return globalForStore.__chronosStore;
}

/* ---------------------------------- orders --------------------------------- */

type OrderRow = {
  ref: string;
  guild_id: string;
  product_value: string;
  product_label: string;
  product_price: string;
  price_amount: number;
  duration_days: number;
  buyer_discord_id: string;
  buyer_username: string;
  buyer_avatar: string | null;
  contact: string | null;
  note: string | null;
  status: OrderStatus;
  payment_method: "qris" | "transfer";
  proof_path: string | null;
  proof_uploaded_at: string | null;
  delivered_key: string | null;
  delivered_at: string | null;
  delivered_by: string | null;
  staff_note: string | null;
  events: OrderEvent[] | null;
  created_at: string;
  updated_at: string;
};

function toOrder(row: OrderRow): Order {
  return {
    ref: row.ref,
    guildId: row.guild_id,
    productValue: row.product_value,
    productLabel: row.product_label,
    productPrice: row.product_price,
    priceAmount: Number(row.price_amount ?? 0),
    durationDays: Number(row.duration_days ?? 0),
    buyerDiscordId: row.buyer_discord_id,
    buyerUsername: row.buyer_username,
    buyerAvatar: row.buyer_avatar,
    contact: row.contact ?? "",
    note: row.note ?? "",
    status: row.status,
    paymentMethod: row.payment_method,
    proofPath: row.proof_path,
    proofUploadedAt: row.proof_uploaded_at,
    deliveredKey: row.delivered_key,
    deliveredAt: row.delivered_at,
    deliveredBy: row.delivered_by,
    staffNote: row.staff_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    events: row.events ?? [],
  };
}

function toRow(order: Order): OrderRow {
  return {
    ref: order.ref,
    guild_id: order.guildId,
    product_value: order.productValue,
    product_label: order.productLabel,
    product_price: order.productPrice,
    price_amount: order.priceAmount,
    duration_days: order.durationDays,
    buyer_discord_id: order.buyerDiscordId,
    buyer_username: order.buyerUsername,
    buyer_avatar: order.buyerAvatar,
    contact: order.contact,
    note: order.note,
    status: order.status,
    payment_method: order.paymentMethod,
    proof_path: order.proofPath,
    proof_uploaded_at: order.proofUploadedAt,
    delivered_key: order.deliveredKey,
    delivered_at: order.deliveredAt,
    delivered_by: order.deliveredBy,
    staff_note: order.staffNote,
    events: order.events,
    created_at: order.createdAt,
    updated_at: order.updatedAt,
  };
}

export function orderEvent(label: string, by?: string): OrderEvent {
  return by ? { at: new Date().toISOString(), label, by } : { at: new Date().toISOString(), label };
}

export async function insertOrder(
  order: Order,
): Promise<{ ok: true; order: Order } | { ok: false; error: string }> {
  if (!hasDatabase) {
    const store = memory();
    if (store.orders.some((existing) => existing.ref === order.ref)) {
      return { ok: false, error: "duplicate ref" };
    }
    store.orders.unshift(order);
    return { ok: true, order };
  }

  const { error } = await db().from("orders").insert(toRow(order));
  if (error) return { ok: false, error: error.message };
  return { ok: true, order };
}

export async function getOrder(ref: string): Promise<Order | null> {
  if (!hasDatabase) return memory().orders.find((order) => order.ref === ref) ?? null;

  const { data, error } = await db().from("orders").select("*").eq("ref", ref).maybeSingle();
  if (error || !data) return null;
  return toOrder(data as OrderRow);
}

export async function listOrdersByBuyer(discordId: string): Promise<Order[]> {
  if (!hasDatabase) {
    return memory()
      .orders.filter((order) => order.buyerDiscordId === discordId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const { data, error } = await db()
    .from("orders")
    .select("*")
    .eq("buyer_discord_id", discordId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];
  return (data as OrderRow[]).map(toOrder);
}

export async function listOrders(options?: { status?: OrderStatus; limit?: number }): Promise<Order[]> {
  const limit = options?.limit ?? 60;

  if (!hasDatabase) {
    return memory()
      .orders.filter((order) => !options?.status || order.status === options.status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  let query = db().from("orders").select("*").order("created_at", { ascending: false }).limit(limit);
  if (options?.status) query = query.eq("status", options.status);

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as OrderRow[]).map(toOrder);
}

export async function updateOrder(ref: string, patch: Partial<Order>): Promise<Order | null> {
  const existing = await getOrder(ref);
  if (!existing) return null;

  const updated: Order = { ...existing, ...patch, updatedAt: new Date().toISOString() };

  if (!hasDatabase) {
    const store = memory();
    store.orders = store.orders.map((order) => (order.ref === ref ? updated : order));
    return updated;
  }

  const { error } = await db().from("orders").update(toRow(updated)).eq("ref", ref);
  if (error) return null;
  return updated;
}

export async function countOrders(status?: OrderStatus): Promise<number> {
  if (!hasDatabase) {
    const store = memory();
    return status ? store.orders.filter((order) => order.status === status).length : store.orders.length;
  }

  let query = db().from("orders").select("ref", { count: "exact", head: true });
  if (status) query = query.eq("status", status);
  const { count } = await query;
  return count ?? 0;
}

export async function sumRevenue(): Promise<number> {
  if (!hasDatabase) {
    return memory()
      .orders.filter((order) => order.status === "delivered")
      .reduce((total, order) => total + (Number.isFinite(order.priceAmount) ? order.priceAmount : 0), 0);
  }

  const { data } = await db().from("orders").select("price_amount").eq("status", "delivered");
  if (!data) return 0;
  return (data as { price_amount: number }[]).reduce((total, row) => total + Number(row.price_amount ?? 0), 0);
}

/* --------------------------------- reviews --------------------------------- */

type ReviewRow = {
  id: string;
  order_ref: string;
  product_value: string;
  product_label: string;
  buyer_username: string;
  rating: number;
  body: string | null;
  created_at: string;
};

function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    orderRef: row.order_ref,
    productValue: row.product_value,
    productLabel: row.product_label,
    buyerUsername: row.buyer_username,
    rating: row.rating,
    body: row.body ?? "",
    createdAt: row.created_at,
  };
}

export async function listReviews(limit = 30): Promise<Review[]> {
  if (!hasDatabase) {
    return [...memory().reviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
  }

  const { data, error } = await db()
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as ReviewRow[]).map(toReview);
}

export async function countReviews(): Promise<number> {
  if (!hasDatabase) return memory().reviews.length;

  const { count } = await db().from("reviews").select("id", { count: "exact", head: true });
  return count ?? 0;
}

export async function getReviewByOrder(ref: string): Promise<Review | null> {  if (!hasDatabase) return memory().reviews.find((review) => review.orderRef === ref) ?? null;

  const { data } = await db().from("reviews").select("*").eq("order_ref", ref).maybeSingle();
  return data ? toReview(data as ReviewRow) : null;
}

export async function insertReview(review: Review): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!hasDatabase) {
    const store = memory();
    if (store.reviews.some((existing) => existing.orderRef === review.orderRef)) {
      return { ok: false, error: "already reviewed" };
    }
    store.reviews.unshift(review);
    return { ok: true };
  }

  const { error } = await db().from("reviews").insert({
    id: review.id,
    order_ref: review.orderRef,
    product_value: review.productValue,
    product_label: review.productLabel,
    buyer_username: review.buyerUsername,
    rating: review.rating,
    body: review.body,
    created_at: review.createdAt,
  });

  if (error) {
    return { ok: false, error: error.code === "23505" ? "already reviewed" : error.message };
  }
  return { ok: true };
}

/* ------------------------------- product meta ------------------------------ */

export async function listProductMeta(): Promise<Record<string, ProductMeta>> {
  if (!hasDatabase) {
    return Object.fromEntries(memory().productMeta);
  }

  const { data, error } = await db().from("product_meta").select("*");
  if (error || !data) return {};

  return Object.fromEntries(
    (data as { product_value: string; promo_label: string | null; featured: boolean; sort_order: number }[]).map((row) => [
      row.product_value,
      {
        productValue: row.product_value,
        promoLabel: row.promo_label,
        featured: Boolean(row.featured),
        sortOrder: Number(row.sort_order ?? 0),
      },
    ]),
  );
}

export async function saveProductMeta(value: string, patch: Partial<ProductMeta>): Promise<void> {
  const current = (await listProductMeta())[value];

  const next: ProductMeta = {
    productValue: value,
    promoLabel: patch.promoLabel !== undefined ? patch.promoLabel : (current?.promoLabel ?? null),
    featured: patch.featured !== undefined ? patch.featured : (current?.featured ?? false),
    sortOrder: patch.sortOrder !== undefined ? patch.sortOrder : (current?.sortOrder ?? 0),
  };

  if (!hasDatabase) {
    memory().productMeta.set(value, next);
    return;
  }

  await db()
    .from("product_meta")
    .upsert(
      {
        product_value: next.productValue,
        promo_label: next.promoLabel,
        featured: next.featured,
        sort_order: next.sortOrder,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "product_value" },
    );
}

export async function deleteProductMeta(value: string): Promise<void> {
  if (!hasDatabase) {
    memory().productMeta.delete(value);
    return;
  }
  await db().from("product_meta").delete().eq("product_value", value);
}

/* --------------------------------- customers ------------------------------- */

type CustomerRow = {
  discord_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  role: CustomerRole;
  first_seen: string;
  last_seen: string;
};

function toCustomer(row: CustomerRow): Customer {
  return {
    discordId: row.discord_id,
    username: row.username,
    displayName: row.display_name || row.username,
    avatarUrl: row.avatar_url,
    role: row.role === "admin" ? "admin" : "customer",
    firstSeen: row.first_seen,
    lastSeen: row.last_seen,
  };
}

/** Called on every sign-in, so the customer list stays fresh by itself. */
export async function upsertCustomer(user: StoreUser): Promise<void> {
  const now = new Date().toISOString();

  if (!hasDatabase) {
    const store = memory();
    const existing = store.customers.get(user.id);
    store.customers.set(user.id, {
      discordId: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: existing?.role ?? "customer",
      firstSeen: existing?.firstSeen ?? now,
      lastSeen: now,
    });
    return;
  }

  await db()
    .from("customers")
    .upsert(
      {
        discord_id: user.id,
        username: user.username,
        display_name: user.displayName,
        avatar_url: user.avatarUrl,
        last_seen: now,
      },
      { onConflict: "discord_id", ignoreDuplicates: false },
    );
}

export async function listCustomers(limit = 200): Promise<Customer[]> {
  if (!hasDatabase) {
    return [...memory().customers.values()].sort((a, b) => b.lastSeen.localeCompare(a.lastSeen)).slice(0, limit);
  }

  const { data, error } = await db()
    .from("customers")
    .select("*")
    .order("last_seen", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as CustomerRow[]).map(toCustomer);
}

export async function getCustomer(discordId: string): Promise<Customer | null> {
  if (!hasDatabase) return memory().customers.get(discordId) ?? null;

  const { data } = await db().from("customers").select("*").eq("discord_id", discordId).maybeSingle();
  return data ? toCustomer(data as CustomerRow) : null;
}

export async function setCustomerRole(discordId: string, role: CustomerRole): Promise<void> {
  if (!hasDatabase) {
    const store = memory();
    const existing = store.customers.get(discordId);
    if (existing) store.customers.set(discordId, { ...existing, role });
    return;
  }

  await db().from("customers").update({ role }).eq("discord_id", discordId);
}

export async function countCustomers(): Promise<number> {
  if (!hasDatabase) return memory().customers.size;

  const { count } = await db().from("customers").select("discord_id", { count: "exact", head: true });
  return count ?? 0;
}

/* --------------------------------- settings -------------------------------- */

export async function getSettings(): Promise<StoreSettings> {
  if (!hasDatabase) return { ...DEFAULT_SETTINGS, ...memory().settings };

  const { data, error } = await db().from("settings").select("value").eq("key", "shop").maybeSingle();
  if (error || !data) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...((data as { value: Partial<StoreSettings> }).value ?? {}) };
}

export async function saveSettings(patch: Partial<StoreSettings>): Promise<StoreSettings> {
  const merged = { ...(await getSettings()), ...patch };

  if (!hasDatabase) {
    memory().settings = merged;
    return merged;
  }

  await db()
    .from("settings")
    .upsert({ key: "shop", value: merged, updated_at: new Date().toISOString() }, { onConflict: "key" });

  return merged;
}

/* ---------------------------------- proofs --------------------------------- */

export const PROOF_TYPES = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
export const PROOF_MAX_BYTES = 6 * 1024 * 1024;

export async function saveProof(
  ref: string,
  file: File,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  if (!PROOF_TYPES.includes(file.type)) return { ok: false, error: "unsupported type" };
  if (file.size > PROOF_MAX_BYTES) return { ok: false, error: "file too large" };

  const extension = file.type === "application/pdf" ? "pdf" : (file.type.split("/")[1] ?? "png");
  const path = `${ref}/${Date.now()}.${extension}`;

  if (!hasDatabase) {
    memory().proofs.set(ref, { bytes: await file.arrayBuffer(), contentType: file.type });
    return { ok: true, path };
  }

  const bytes = await file.arrayBuffer();
  const { error } = await db()
    .storage.from(PROOF_BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: true });

  if (error) return { ok: false, error: error.message };
  return { ok: true, path };
}

export async function readProof(path: string): Promise<{ bytes: ArrayBuffer; contentType: string } | null> {
  if (!hasDatabase) {
    const ref = path.split("/")[0];
    return memory().proofs.get(ref) ?? null;
  }

  const { data, error } = await db().storage.from(PROOF_BUCKET).download(path);
  if (error || !data) return null;
  return { bytes: await data.arrayBuffer(), contentType: data.type || "application/octet-stream" };
}
