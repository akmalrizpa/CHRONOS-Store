import { fetchDashboard, fetchHealth, hasBotUrl, isBotConfigured } from "./bot";
import { parsePrice } from "./price";
import { listProductMeta } from "./store";
import type { BotCategory, BotHealth, BotProduct, CatalogProduct, ProductMeta } from "./types";

export type Catalog = {
  source: "bot" | "demo";
  guildName: string;
  guildIconUrl: string | null;
  memberCount: number;
  categories: BotCategory[];
  products: CatalogProduct[];
  fetchedAt: string;
  error?: string;
};

const TTL_MS = 60_000;
let cache: { at: number; value: Catalog } | null = null;

/** Shown while DASH_API_URL / CHRONOS_GUILD_ID are not set yet, so the store can be browsed locally. */
const DEMO_CATALOG: Catalog = {
  source: "demo",
  guildName: "CHRONOS demo",
  guildIconUrl: null,
  memberCount: 0,
  categories: [
    { id: "demo-1", label: "Demo category — Android", emoji: "", requiresKey: true, isDefault: true },
    { id: "demo-2", label: "Demo category — PC", emoji: "", requiresKey: true },
  ],
  products: [
    { label: "Demo product — 7 days", value: "demo7", price: "Rp 25.000", category: "demo-1", requiresKey: true, days: 7 },
    { label: "Demo product — 30 days", value: "demo30", price: "Rp 60.000", category: "demo-1", requiresKey: true, days: 30 },
    { label: "Demo product — lifetime", value: "demolife", price: "Rp 150.000", category: "demo-2", requiresKey: true, days: 0 },
  ].map((product) => {
    const parsed = parsePrice(product.price);
    return {
      ...product,
      priceAmount: parsed.amount,
      priceReadable: parsed.readable,
      durationDays: Number(product.days ?? 0),
      categoryLabel: product.category === "demo-1" ? "Demo category — Android" : "Demo category — PC",
      promoLabel: null,
      featured: false,
      autoRole: false,
    };
  }),
  fetchedAt: new Date().toISOString(),
};

function decorate(
  products: BotProduct[] | undefined,
  categories: BotCategory[],
  meta: Record<string, ProductMeta>,
): CatalogProduct[] {
  const categoryLabels = new Map(categories.map((category) => [category.id, category.label]));

  return (products ?? []).map((product) => {
    const parsed = parsePrice(product.price);
    const productMeta = meta[product.value];

    return {
      ...product,
      priceAmount: parsed.amount,
      priceReadable: parsed.readable,
      durationDays: Number(product.days ?? 0),
      categoryLabel: categoryLabels.get(product.category) ?? product.category,
      promoLabel: productMeta?.promoLabel ?? null,
      featured: productMeta?.featured ?? false,
      autoRole: Boolean(product.roleId),
    };
  });
}

function order(products: CatalogProduct[]): CatalogProduct[] {
  return [...products].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    const priceA = Number.isFinite(a.priceAmount) ? a.priceAmount : Number.MAX_SAFE_INTEGER;
    const priceB = Number.isFinite(b.priceAmount) ? b.priceAmount : Number.MAX_SAFE_INTEGER;
    if (priceA !== priceB) return priceA - priceB;
    return a.label.localeCompare(b.label);
  });
}

export async function getCatalog(options?: { fresh?: boolean }): Promise<Catalog> {
  if (!options?.fresh && cache && Date.now() - cache.at < TTL_MS) return cache.value;

  if (!isBotConfigured) {
    const value = { ...DEMO_CATALOG, fetchedAt: new Date().toISOString() };
    cache = { at: Date.now(), value };
    return value;
  }

  const [dashboard, meta] = await Promise.all([fetchDashboard(), listProductMeta()]);

  if (!dashboard.ok) {
    // Keep serving the last good catalog — a bot restart must not empty the shop.
    if (cache) return { ...cache.value, error: dashboard.error };
    return { ...DEMO_CATALOG, source: "demo", error: dashboard.error, fetchedAt: new Date().toISOString() };
  }

  const categories = dashboard.data.config.ticketCategories ?? [];
  const products = order(decorate(dashboard.data.config.products, categories, meta));
  const value: Catalog = {
    source: "bot",
    guildName: dashboard.data.guild?.name ?? "CHRONOS",
    guildIconUrl: dashboard.data.guild?.iconUrl ?? null,
    memberCount: dashboard.data.guild?.memberCount ?? 0,
    categories,
    products,
    fetchedAt: new Date().toISOString(),
  };

  cache = { at: Date.now(), value };
  return value;
}

export function findProduct(catalog: Catalog, value: string): CatalogProduct | undefined {
  return catalog.products.find((product) => product.value === value);
}

export function clearCatalogCache() {
  cache = null;
}

let dashboardCache: { at: number; value: Awaited<ReturnType<typeof fetchDashboard>> } | null = null;
const DASHBOARD_TTL_MS = 20_000;

/**
 * The raw bot payload (stats, boosters, keys, levels…). Cached briefly so
 * clicking between admin pages does not fire one request per render.
 */
export async function getBotDashboard(options?: { fresh?: boolean }) {
  if (!options?.fresh && dashboardCache && Date.now() - dashboardCache.at < DASHBOARD_TTL_MS) {
    return dashboardCache.value;
  }

  const value = await fetchDashboard();
  dashboardCache = { at: Date.now(), value };
  return value;
}

export function clearDashboardCache() {
  dashboardCache = null;
}

let healthCache: { at: number; value: BotHealth | null } | null = null;
const HEALTH_TTL_MS = 30_000;

/** Cached, so the footer on every page does not hit the bot on every render. */
export async function getBotHealth(): Promise<BotHealth | null> {
  if (!hasBotUrl) return null;
  if (healthCache && Date.now() - healthCache.at < HEALTH_TTL_MS) return healthCache.value;

  const result = await fetchHealth();
  const value = result.ok && result.data.ok ? result.data : null;
  healthCache = { at: Date.now(), value };
  return value;
}
