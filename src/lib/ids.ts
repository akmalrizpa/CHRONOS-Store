import { randomBytes } from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/I/1 — these get misread in chat
const ORDER_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function pick(alphabet: string, length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (const byte of bytes) out += alphabet[byte % alphabet.length];
  return out;
}

/** Order reference a buyer can type from a screenshot: CS-7K4M2Q */
export function createOrderRef(): string {
  return `CS-${pick(ORDER_ALPHABET, 6)}`;
}

/** Key handed to the bot: 3 groups of 5, the shape /set-key documents. */
export function generateKey(): string {
  return [pick(ALPHABET, 5), pick(ALPHABET, 5), pick(ALPHABET, 5)].join("-");
}

export function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${pick(ALPHABET, 6).toLowerCase()}`;
}
