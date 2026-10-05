export type BotProduct = {
  label: string;
  value: string;
  price: string;
  category: string;
  requiresKey?: boolean;
  roleId?: string;
  days?: number;
};

export type BotCategory = {
  id: string;
  label: string;
  emoji?: string;
  style?: string;
  requiresKey?: boolean;
  isDefault?: boolean;
};

export type BotGuild = {
  id: string;
  name: string;
  iconUrl: string | null;
  memberCount: number;
  ownerId: string | null;
};

export type BotHealth = {
  ok: boolean;
  ready: boolean;
  guildCount: number;
  uptimeSec: number;
  pingMs: number;
  version: string;
};

/** A bot product with the derived fields the storefront needs. */
export type CatalogProduct = BotProduct & {
  priceAmount: number;
  priceReadable: boolean;
  durationDays: number;
  categoryLabel: string;
  promoLabel: string | null;
  featured: boolean;
  autoRole: boolean;
};

export type OrderStatus = "pending" | "review" | "delivered" | "rejected";

export type OrderEvent = { at: string; label: string; by?: string };

export type Order = {
  ref: string;
  guildId: string;
  productValue: string;
  productLabel: string;
  productPrice: string;
  priceAmount: number;
  durationDays: number;
  buyerDiscordId: string;
  buyerUsername: string;
  buyerAvatar: string | null;
  contact: string;
  note: string;
  status: OrderStatus;
  paymentMethod: "qris" | "transfer";
  proofPath: string | null;
  proofUploadedAt: string | null;
  deliveredKey: string | null;
  deliveredAt: string | null;
  deliveredBy: string | null;
  staffNote: string | null;
  createdAt: string;
  updatedAt: string;
  events: OrderEvent[];
};

export type Review = {
  id: string;
  orderRef: string;
  productValue: string;
  productLabel: string;
  buyerUsername: string;
  rating: number;
  body: string;
  createdAt: string;
};

export type ProductMeta = {
  productValue: string;
  promoLabel: string | null;
  featured: boolean;
  sortOrder: number;
};

export type CustomerRole = "customer" | "admin";

/** One row per Discord account that has signed in. */
export type Customer = {
  discordId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: CustomerRole;
  firstSeen: string;
  lastSeen: string;
};

export type StoreSettings = {
  qrisImageUrl: string;
  paymentNote: string;
  supportHours: string;
  whatsappUrl: string;
  telegramUrl: string;
  discordInviteUrl: string;
  currencyLabel: string;
  storeOpen: boolean;
  promoBanner: string;
};

export type StoreUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  /** Read-only demo session (DEMO_MODE) — every write action refuses it. */
  demo?: boolean;
};

/* --------------------------- bot statistics payload -------------------------- */

export type BotTopUser = { userId: string; value: number; tag?: string | null; username?: string | null };

export type BotStats = {
  server: {
    totalUsers: number;
    totalMessages: number;
    totalPurchases: number;
    totalRevenue: number;
    totalGiveawaysWon: number;
  };
  top: {
    messages: BotTopUser[];
    vipPurchases: BotTopUser[];
    totalSpent: BotTopUser[];
    giveawaysWon: BotTopUser[];
  };
};

export type BotBooster = {
  userId: string;
  tag: string | null;
  displayName: string | null;
  premiumSince: number | null;
};

export type BotBoostEvent = { userId: string; event: string; at: number | null; boostedAt: number | null };

export type BotLevelUser = { userId: string; level: number; xp: number; totalXp: number };

/* -------------------------------- activity log ------------------------------- */

export type ActivityAction =
  | "login"
  | "order.created"
  | "order.proof"
  | "order.delivered"
  | "order.rejected"
  | "order.note"
  | "product.created"
  | "product.updated"
  | "product.deleted"
  | "category.created"
  | "category.updated"
  | "category.deleted"
  | "customer.role"
  | "settings.saved"
  | "review.created";

export type ActivityEntry = {
  id: string;
  at: string;
  actorId: string;
  actorName: string;
  action: ActivityAction;
  target: string;
  detail: string;
};
