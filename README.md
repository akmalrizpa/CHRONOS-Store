# CHRONOS-Store

Web storefront for the **CHRONOS** Discord bot. The catalog comes from the bot, buyers log
in with Discord, payment is verified by staff, and one click releases the key — the bot then
stores it, grants the product's role, DMs the buyer and schedules the expiry.

```
Buyer                     Store (Vercel)                     Bot (DASH API)
browse /shop   ───────►   GET /guilds/:id/dashboard   ─────►  config.products
checkout       ───────►   order in Supabase
pay + proof    ───────►   proof in Storage
                          staff clicks Deliver
                          POST /guilds/:id/keys       ─────►  addKey → role → DM → expiry
key shown      ◄───────   order.status = delivered
```

No bot code change is needed: the store uses the same DASH API and the same product-mode
`/keys` endpoint the CHRONOS-Dashboard already uses.

## What the store knows about products

Products live in the bot (`/add-product`, or Products & Categories in the dashboard) with
`label`, `value`, `price`, `category`, `requiresKey` and optionally `roleId` + `days`.
The store only adds two things in its own database:

- **promo label** — a badge on the product card (no price maths; the bot has no discount field)
- **featured** — puts the product in the Featured block on the home page

Durations come from `days` (0 = permanent). One product = one duration, so "Cheat X — 7 days"
and "Cheat X — 30 days" are two products in the bot.

## Setup

1. **Supabase** (optional but recommended — without it orders live in memory and vanish on
   restart): create a project, run `supabase/schema.sql` in the SQL editor, copy the project
   URL and the **service role** key.
2. **Discord application** — reuse the one from the dashboard, and add the redirect URI
   `https://your-store.vercel.app/api/auth/callback` in the Developer Portal (OAuth2 tab).
3. **Environment** — copy `.env.example` to `.env.local` and fill it in. The bot's
   `DASH_API_URL` is the tunnel URL the dashboard already uses; `DASH_API_TOKEN` must match
   the bot's `.env`; `CHRONOS_GUILD_ID` is your Discord server ID.
4. `npm install`, then `npm run dev` → http://localhost:3000

Without the bot env vars the shop shows a clearly marked demo catalog, so the design can be
clicked through before the bot is connected.

## Delivery flow

1. Buyer picks a product → signs in with Discord → order is created (`pending`).
2. Buyer uploads the payment proof on the order page → status `review`.
3. Staff opens `/admin`, checks the proof, and either:
   - types a key (for account-based products), or leaves the field empty and lets the store
     generate one (`XXXXX-XXXXX-XXXXX`), then hits **Deliver key**, or
   - rejects the order with a reason the buyer sees.
4. Delivering calls the bot, which grants the role, DMs the key, writes the invoice and
   schedules the auto-expire. The key also appears on the buyer's order page.

Every failure from the bot (unknown product, buyer not in the server, role missing, no
auto-role configured) is shown to staff verbatim instead of disappearing.

## Who is staff

`STORE_ADMIN_DISCORD_IDS` — comma-separated Discord user IDs with access to `/admin`.
It is read live from the env on every request, so removing an ID takes effect immediately.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | dev server |
| `npm run build` | production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | price parser + duration label tests (the same rules the bot uses in `/add-product`) |

## Notes

- Payment is manual on purpose (QRIS / bank transfer + proof). The checkout page says so and
  the code keeps a `payment_method` column, so a gateway (Midtrans / Tripay) can be added
  later without reshaping the orders table.
- Product prices are displayed exactly as the bot stores them (`Rp 50.000`, `$12.50`, `30rb`).
  The parsed number is only used for sorting and stats.
- The FAQ text in `src/locales/{en,id}.json` mentions that refunds are decided by staff —
  adjust it if your policy differs.
- Payment proofs are private: `/api/proofs/<ref>` only answers the buyer and staff.
