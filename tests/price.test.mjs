import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePrice, durationLabel } from "../src/lib/price.ts";

// The same formats /add-product accepts in the bot (CHRONOS-bot
// src/commands/products.js → priceValidationError), so a price typed by an
// admin is read the same way by the store and by the bot's stats.
const cases = [
  ["25000", 25000],
  ["25.000", 25000],
  ["25,000", 25000],
  ["$3", 3],
  ["$2.50", 2.5],
  ["5.88", 5.88],
  ["5,88", 5.88],
  ["€25", 25],
  ["Rp 30.000", 30000],
  ["30rb", 30000],
  ["3jt", 3000000],
  ["3$ USD | Rp 25.000", 25000],
  ["1.234.567", 1234567],
  ["free", 0],
  ["gratis", 0],
  ["0", 0],
];

for (const [input, expected] of cases) {
  test(`parsePrice(${JSON.stringify(input)}) → ${expected}`, () => {
    assert.equal(parsePrice(input).amount, expected);
  });
}

test("unreadable prices are marked, not silently zeroed", () => {
  const parsed = parsePrice("ask staff");
  assert.equal(parsed.readable, false);
  assert.ok(Number.isNaN(parsed.amount));
});

test("currency detection follows the picked half of a dual price", () => {
  assert.equal(parsePrice("3$ USD | Rp 25.000").currency, "IDR");
  assert.equal(parsePrice("$3").currency, "USD");
  assert.equal(parsePrice("30000").currency, null);
});

test("duration labels read like a human wrote them", () => {
  assert.equal(durationLabel(0, "en"), "Lifetime");
  assert.equal(durationLabel(7, "en"), "7 days");
  assert.equal(durationLabel(30, "en"), "1 month");
  assert.equal(durationLabel(90, "en"), "3 months");
  assert.equal(durationLabel(0, "id"), "Permanen");
  assert.equal(durationLabel(7, "id"), "7 hari");
  assert.equal(durationLabel(30, "id"), "1 bulan");
});
