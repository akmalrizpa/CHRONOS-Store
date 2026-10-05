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
};
