/**
 * Price parsing with the same rules the bot applies in /add-product
 * (src/commands/products.js → priceValidationError): the bot stores the price as
 * the admin typed it, so the store keeps the raw string for display and only
 * needs a number for sorting, totals and stats.
 *
 *   "25000" · "25.000" · "25,000" → 25 000
 *   "$3" · "€25" · "25 usd"       → 3 / 25
 *   "$2.50" · "5.88" · "5,88"     → 2.5 / 5.88
 *   "30rb" · "3jt"                → 30 000 / 3 000 000
 *   "3$ USD | Rp 25.000"          → 25 000 (the Rupiah half is what the bot records)
 *   "free" · "gratis" · "0"       → 0
 */

const FREE_WORDS = new Set(["0", "free", "gratis", "-", ""]);

const SUFFIXES: Record<string, number> = {
  rb: 1_000,
  ribu: 1_000,
  k: 1_000,
  jt: 1_000_000,
  juta: 1_000_000,
  m: 1_000_000,
};

function numberFromToken(token: string): number {
  const cleaned = token.trim();
  if (!cleaned) return Number.NaN;

  const hasDot = cleaned.includes(".");
  const hasComma = cleaned.includes(",");

  if (hasDot && hasComma) {
    // "1.234,56" (id) or "1,234.56" (en): whichever separator comes last is decimal.
    const decimalSep = cleaned.lastIndexOf(".") > cleaned.lastIndexOf(",") ? "." : ",";
    const thousandSep = decimalSep === "." ? "," : ".";
    return Number(cleaned.split(thousandSep).join("").replace(decimalSep, "."));
  }

  const sep = hasDot ? "." : hasComma ? "," : null;
  if (!sep) return Number(cleaned);

  const [head, ...rest] = cleaned.split(sep);
  // More than one separator of the same kind means they are all thousands.
  if (rest.length > 1) return Number([head, ...rest].join(""));

  const tail = rest[0];
  const thousands = tail.length === 3 && head.length <= 3;
  return thousands ? Number(head + tail) : Number(`${head}.${tail}`);
}

export type ParsedPrice = {
  amount: number;
  currency: string | null;
  free: boolean;
  readable: boolean;
};

export function parsePrice(raw: string | null | undefined): ParsedPrice {
  const text = String(raw ?? "").trim();
  const lower = text.toLowerCase();

  if (FREE_WORDS.has(lower)) return { amount: 0, currency: null, free: true, readable: true };

  // Dual-currency price: the bot records the Rupiah half.
  const halves = lower
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
  const picked = halves.length > 1 ? (halves.find((part) => /\brp\b/.test(part)) ?? halves[0]) : halves[0] ?? lower;

  const currency = /\brp\b/.test(picked)
    ? "IDR"
    : /[$]|usd/.test(picked)
      ? "USD"
      : /[€]|eur/.test(picked)
        ? "EUR"
        : /[£]|gbp/.test(picked)
          ? "GBP"
          : null;

  const match = picked.match(/(\d+(?:[.,]\d+)*)\s*(rb|ribu|jt|juta|k|m)?/);
  if (!match) return { amount: Number.NaN, currency, free: false, readable: false };

  const base = numberFromToken(match[1]);
  const amount = base * (match[2] ? (SUFFIXES[match[2]] ?? 1) : 1);
  const readable = Number.isFinite(amount) && amount > 0;

  return { amount: readable ? amount : Number.NaN, currency, free: false, readable };
}

export function formatAmount(amount: number, label: string): string {
  if (!Number.isFinite(amount)) return "—";
  const formatted = amount.toLocaleString("id-ID");
  return label ? `${label} ${formatted}` : formatted;
}

export function durationLabel(days: number | undefined | null, locale: "en" | "id"): string {
  const value = Number(days ?? 0);
  if (!value || value <= 0) return locale === "id" ? "Permanen" : "Lifetime";
  if (value % 30 === 0 && value >= 30) {
    const months = value / 30;
    return locale === "id" ? `${months} bulan` : `${months} month${months > 1 ? "s" : ""}`;
  }
  if (value === 7) return locale === "id" ? "7 hari" : "7 days";
  return locale === "id" ? `${value} hari` : `${value} day${value > 1 ? "s" : ""}`;
}
