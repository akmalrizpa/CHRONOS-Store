import type { BotBooster } from "@/lib/types";

/**
 * Sample numbers for the read-only demo login (DEMO_MODE=true) when the bot is
 * not connected yet. Every screen that renders these labels them as sample
 * data — they are never mixed into real statistics.
 */
export const DEMO_SERVER_STATS = {
  totalUsers: 214,
  totalMessages: 2705,
  totalPurchases: 67,
  totalRevenue: 1975000,
  totalGiveawaysWon: 5,
};

export const DEMO_TOP_MESSAGES = [
  { userId: "1290700587373039619", value: 412 },
  { userId: "874212039485740544", value: 318 },
  { userId: "1354505315948348400", value: 264 },
  { userId: "1892344402281934337", value: 207 },
  { userId: "637639834028822136", value: 188 },
  { userId: "259840393840582217", value: 151 },
  { userId: "7541042849915347584", value: 133 },
  { userId: "935654777872778240", value: 96 },
  { userId: "1063504153388486522", value: 71 },
  { userId: "1033596405992930118", value: 42 },
];

export const DEMO_TOP_BUYERS = [
  { userId: "123154477012003297830", value: 14 },
  { userId: "653650593802382216", value: 11 },
  { userId: "1353569601799963300", value: 9 },
  { userId: "4155150918804356557", value: 7 },
  { userId: "1033596405992930118", value: 4 },
];

export const DEMO_BOOSTERS: { count: number; level: number; list: BotBooster[] } = {
  count: 0,
  level: 0,
  list: [],
};
