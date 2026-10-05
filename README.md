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
The admin area edits all of that straight through the bot's DASH API, so a save here is
the same change the Discord ticket flow sells — no second catalog to keep in sync.
Two things live only in the store's own database:

- **promo label** — a badge on the product card (no price maths; the bot has no discount field)
- **featured** — puts the product in the Featured block on the home page

Durations come from `days` (0 = permanent). One product = one duration, so "Cheat X — 7 days"
and "Cheat X — 30 days" are two products in the bot.

## Admin area

`/admin` is staff-only and split into pages:

| Page | What it does |
| --- | --- |
| `/admin` | counts per status, delivered value, product/customer/review totals, latest orders, latest activity, bot connection |
| `/admin/orders` | payment proofs, one-click key release, reject with a reason, internal notes |
| `/admin/products` | one container per product: edit name/price/category/duration/auto-role/promo/featured, delete (two-step), plus full category CRUD |
| `/admin/stats` | the bot's own counters (messages, purchases, revenue, giveaways won, keys on record, boosters, level leaderboard) next to store numbers (orders per status, revenue, average order, best selling products, top buyers) and a 14-day bar list |
| `/admin/log` | every write in the store with actor, target and detail — filterable by order / product / category / customer / settings / review / login |
| `/admin/customers` | everyone who signed in, with order count and spend, and promote/demote to admin |
| `/admin/settings` | QRIS image, payment note, support hours, contact links, promo banner, shop open/closed |

## Demo login

Set `DEMO_MODE=true` and `/login` grows two buttons: **Demo as staff** and **Demo as buyer**.
A demo session needs no Discord account, can browse the whole admin area — statistics, log,
orders, products — and is refused by every write action, so it can be shown to a customer or
a friend without handing out any power. It expires after 3 hours and the header keeps a
"read only" reminder on screen. When the bot is not connected, the statistics page shows a
clearly labelled sample set instead of zeros.

## Activity log

Every write goes through `logActivity()`: logins, order creation, payment proofs, key
releases, rejects, internal notes, product/category changes, role changes, settings saves and
reviews. Rows land in the Supabase table `activity_log` (run `supabase/schema.sql` again) and
are readable at `/admin/log`, with the six newest also on the dashboard. Without Supabase the
log lives in memory and clears on restart.


Products and categories go to the bot; promo, featured, settings and customers stay in
Supabase. Role and category pickers read the real Discord guild through `GET /guilds/:id/meta`,
so nobody types a Discord ID by hand. The bot enforces its own limits (25 products, 25
categories, `[a-zA-Z0-9_-]` IDs) and those messages are shown to staff verbatim.

## Who is staff

Two sources, both checked on every request:

1. `STORE_ADMIN_DISCORD_IDS` — comma-separated IDs. Always admin, so a fresh deployment can
   never lock you out.
2. `role = 'admin'` on the customer row, set from `/admin/customers`.

Customers sign in with Discord and see only their own orders (`/orders`, `/account`).


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
3. Staff opens `/admin/orders`, checks the proof, and either:
   - types a key (for account-based products), or leaves the field empty and lets the store
     generate one (`XXXXX-XXXXX-XXXXX`), then hits **Deliver key**, or
   - rejects the order with a reason the buyer sees.
4. Delivering calls the bot, which grants the role, DMs the key, writes the invoice and
   schedules the auto-expire. The key also appears on the buyer's order page.

Every failure from the bot (unknown product, buyer not in the server, role missing, no
auto-role configured) is shown to staff verbatim instead of disappearing.

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
