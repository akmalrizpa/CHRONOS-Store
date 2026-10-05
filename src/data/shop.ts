import type { StoreSettings } from "@/lib/types";

/**
 * Defaults for everything the shop owner can change from /admin/settings, plus
 * the static structure of the marketing blocks (their copy lives in the locale
 * files under why.<id> and faq.items).
 */
export const DEFAULT_SETTINGS: StoreSettings = {
  qrisImageUrl: "",
  paymentNote: "",
  supportHours: "08:00 – 23:00 WIB",
  whatsappUrl: "",
  telegramUrl: "",
  discordInviteUrl: "https://discord.gg/ByGCBbnYun",
  currencyLabel: "Rp",
  storeOpen: true,
  promoBanner: "",
};

export const WHY_US = [{ id: "delivery" }, { id: "duration" }, { id: "support" }];

export const FAQ_IDS = ["delivery", "duration", "payment", "notReceived", "wrongAccount", "refund"];

export const PAYMENT_METHODS = ["QRIS", "Bank transfer", "PayPal", "Visa", "Mastercard"] as const;
