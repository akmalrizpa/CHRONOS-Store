import { getBotDashboard } from "@/lib/catalog";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { createTranslator } from "@/i18n/dictionary";
import { getSettings, listCustomers, listOrders } from "@/lib/store";
import { formatAmount } from "@/lib/price";
import { isBotConfigured } from "@/lib/bot";
import { DEMO_BOOSTERS, DEMO_SERVER_STATS, DEMO_TOP_BUYERS, DEMO_TOP_MESSAGES } from "@/data/demo";
import { badgeMuted, btnOutline, panel, sectionTitle } from "@/components/ui";
import type { BotTopUser } from "@/lib/types";

export const dynamic = "force-dynamic";

type Row = { key: string; label: string; value: string; hint?: string };

function StatCard({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className={`${panel} p-5`}>
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className={`mt-2 font-mono text-2xl font-semibold ${tone ?? ""}`}>{value}</p>
    </div>
  );
}

function RankedList({ title, rows, empty }: { title: string; rows: Row[]; empty: string }) {
  return (
    <section className={panel}>
      <h2 className="border-b border-line px-5 py-4 font-mono text-xs uppercase tracking-[0.16em] text-muted">
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted">{empty}</p>
      ) : (
        <ol className="divide-y divide-line">
          {rows.map((row, index) => (
            <li key={row.key} className="flex items-center gap-3 px-5 py-2.5">
              <span className="w-6 font-mono text-xs text-muted">{index + 1}.</span>
              <span className="min-w-0 flex-1 truncate font-mono text-xs">{row.label}</span>
              {row.hint && <span className="font-mono text-xs text-muted">{row.hint}</span>}
              <span className="font-mono text-sm font-semibold">{row.value}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function topRows(list: BotTopUser[] | undefined): Row[] {
  return (list ?? []).map((entry) => ({
    key: entry.userId,
    label: entry.tag || entry.username || entry.userId,
    value: Number(entry.value ?? 0).toLocaleString("id-ID"),
  }));
}

export default async function AdminStatsPage() {
  const locale = await getLocale();
  const { t } = createTranslator(locale);

  const [dashboard, orders, settings, customers, user] = await Promise.all([
    getBotDashboard(),
    listOrders({ limit: 300 }),
    getSettings(),
    listCustomers(300),
    getSession(),
  ]);

  const demo = Boolean(user?.demo);
  const botReady = isBotConfigured && dashboard.ok;

  const server = botReady && dashboard.ok ? dashboard.data.stats?.server : undefined;
  const boosters = botReady && dashboard.ok ? dashboard.data.boosters : undefined;
  const keys = botReady && dashboard.ok ? (dashboard.data.keys ?? []) : [];
  const levelTop = botReady && dashboard.ok ? (dashboard.data.levelTop ?? []) : [];

  const showSample = !botReady && demo;
  const serverStats = server ?? (showSample ? DEMO_SERVER_STATS : undefined);
  const sample = showSample && !server;

  const number = (value: number) => value.toLocaleString(locale === "id" ? "id-ID" : "en-US");

  // Store-side aggregates, always from real orders.
  const byStatus = {
    pending: orders.filter((order) => order.status === "pending").length,
    review: orders.filter((order) => order.status === "review").length,
    delivered: orders.filter((order) => order.status === "delivered").length,
    rejected: orders.filter((order) => order.status === "rejected").length,
  };
  const delivered = orders.filter((order) => order.status === "delivered");
  const storeRevenue = delivered.reduce(
    (total, order) => total + (Number.isFinite(order.priceAmount) ? order.priceAmount : 0),
    0,
  );
  const average = delivered.length > 0 ? Math.round(storeRevenue / delivered.length) : 0;

  const perBuyer = new Map<string, { name: string; count: number; spent: number }>();
  for (const order of orders) {
    const entry = perBuyer.get(order.buyerDiscordId) ?? { name: order.buyerUsername, count: 0, spent: 0 };
    entry.count += 1;
    if (order.status === "delivered" && Number.isFinite(order.priceAmount)) entry.spent += order.priceAmount;
    perBuyer.set(order.buyerDiscordId, entry);
  }

  const storeTopBuyers: Row[] = [...perBuyer.entries()]
    .sort((a, b) => b[1].spent - a[1].spent)
    .slice(0, 10)
    .map(([discordId, entry]) => ({
      key: discordId,
      label: entry.name || discordId,
      hint: t("admin.statOrderCount", { count: entry.count }),
      value: formatAmount(entry.spent, settings.currencyLabel),
    }));

  const perProduct = new Map<string, { label: string; count: number; revenue: number }>();
  for (const order of delivered) {
    const entry = perProduct.get(order.productValue) ?? { label: order.productLabel, count: 0, revenue: 0 };
    entry.count += 1;
    entry.revenue += Number.isFinite(order.priceAmount) ? order.priceAmount : 0;
    perProduct.set(order.productValue, entry);
  }

  const storeTopProducts: Row[] = [...perProduct.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([value, entry]) => ({
      key: value,
      label: entry.label,
      hint: `${entry.count}×`,
      value: formatAmount(entry.revenue, settings.currencyLabel),
    }));

  // Orders per day for the last 14 days — a plain bar list, no chart library.
  const days = Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (13 - index));
    return { date, count: 0, revenue: 0 };
  });
  for (const order of orders) {
    const created = new Date(order.createdAt);
    created.setHours(0, 0, 0, 0);
    const bucket = days.find((day) => day.date.getTime() === created.getTime());
    if (!bucket) continue;
    bucket.count += 1;
    if (order.status === "delivered" && Number.isFinite(order.priceAmount)) bucket.revenue += order.priceAmount;
  }
  const busiest = Math.max(1, ...days.map((day) => day.count));

  const messages = topRows(
    botReady && dashboard.ok ? dashboard.data.stats?.top.messages : showSample ? DEMO_TOP_MESSAGES : [],
  );
  const purchases = topRows(
    botReady && dashboard.ok ? dashboard.data.stats?.top.vipPurchases : showSample ? DEMO_TOP_BUYERS : [],
  );
  const spenders = topRows(botReady && dashboard.ok ? dashboard.data.stats?.top.totalSpent : []);
  const boosterList = boosters ?? (showSample ? DEMO_BOOSTERS : undefined);

  return (
    <div className="space-y-10">
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className={sectionTitle}>{t("admin.statsBotTitle")}</h2>
          {sample && <span className={badgeMuted}>{t("demo.sampleBadge")}</span>}
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{t("admin.statsBotLead")}</p>

        {!serverStats ? (
          <div className={`${panel} mt-6 p-6`}>
            <p className="text-sm text-muted">{t("admin.statsNoBot")}</p>
            {!demo && (
              <a href="/admin/settings" className={`${btnOutline} mt-4`}>
                {t("admin.navSettings")}
              </a>
            )}
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label={t("admin.statMessages")} value={number(serverStats.totalMessages)} />
              <StatCard label={t("admin.statPurchases")} value={number(serverStats.totalPurchases)} />
              <StatCard
                label={t("admin.statBotRevenue")}
                value={formatAmount(serverStats.totalRevenue, settings.currencyLabel)}
              />
              <StatCard label={t("admin.statGiveaways")} value={number(serverStats.totalGiveawaysWon)} />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label={t("admin.statTrackedUsers")} value={number(serverStats.totalUsers)} />
              <StatCard label={t("admin.statActiveKeys")} value={number(keys.length)} />
              <StatCard
                label={t("admin.statBoosters")}
                value={`${boosterList?.count ?? 0}`}
                tone={(boosterList?.count ?? 0) > 0 ? "text-accent" : undefined}
              />
              <StatCard
                label={t("admin.statBoostLevel")}
                value={boosterList && boosterList.level > 0 ? `Lv ${boosterList.level}` : "Level 0"}
              />
            </div>
          </>
        )}
      </section>

      <section>
        <h2 className={sectionTitle}>{t("admin.statsStoreTitle")}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{t("admin.statsStoreLead")}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label={t("admin.statOrdersPending")} value={number(byStatus.pending)} tone="text-muted" />
          <StatCard label={t("admin.statOrdersReview")} value={number(byStatus.review)} tone="text-accent" />
          <StatCard label={t("admin.statOrdersDelivered")} value={number(byStatus.delivered)} tone="text-ok" />
          <StatCard label={t("admin.statOrdersRejected")} value={number(byStatus.rejected)} tone="text-danger" />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label={t("admin.statStoreRevenue")} value={formatAmount(storeRevenue, settings.currencyLabel)} />
          <StatCard label={t("admin.statAverage")} value={formatAmount(average, settings.currencyLabel)} />
          <StatCard label={t("admin.statBuyers")} value={number(perBuyer.size)} />
          <StatCard label={t("admin.statCustomers")} value={number(customers.length)} />
        </div>
      </section>

      <section className={panel}>
        <h2 className="border-b border-line px-5 py-4 font-mono text-xs uppercase tracking-[0.16em] text-muted">
          {t("admin.statLast14")}
        </h2>
        <ul className="space-y-2 px-5 py-5">
          {days.map((day) => (
            <li key={day.date.toISOString()} className="flex items-center gap-3">
              <span className="w-20 font-mono text-xs text-muted">
                {day.date.toLocaleDateString(locale === "id" ? "id-ID" : "en-GB", { day: "2-digit", month: "short" })}
              </span>
              <span className="h-2 flex-1 rounded-card bg-panel-2">
                <span
                  className="block h-2 rounded-card bg-accent"
                  style={{ width: `${Math.round((day.count / busiest) * 100)}%` }}
                />
              </span>
              <span className="w-24 text-right font-mono text-xs text-muted">
                {day.count}× · {day.revenue > 0 ? formatAmount(day.revenue, settings.currencyLabel) : "—"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <RankedList title={t("admin.statMostActive")} rows={messages} empty={t("admin.statsNoBot")} />
        <RankedList title={t("admin.statTopBuyersBot")} rows={purchases} empty={t("admin.statsNoBot")} />
        <RankedList title={t("admin.statTopSpenders")} rows={spenders} empty={t("admin.statsNoBot")} />
        <RankedList title={t("admin.statTopBuyersStore")} rows={storeTopBuyers} empty={t("admin.statsNoOrders")} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RankedList title={t("admin.statTopProducts")} rows={storeTopProducts} empty={t("admin.statsNoOrders")} />

        <section className={panel}>
          <h2 className="border-b border-line px-5 py-4 font-mono text-xs uppercase tracking-[0.16em] text-muted">
            {t("admin.statLevels")}
          </h2>
          {levelTop.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">{t("admin.statsNoBot")}</p>
          ) : (
            <ol className="divide-y divide-line">
              {levelTop.slice(0, 10).map((entry, index) => (
                <li key={entry.userId} className="flex items-center gap-3 px-5 py-2.5">
                  <span className="w-6 font-mono text-xs text-muted">{index + 1}.</span>
                  <span className="min-w-0 flex-1 truncate font-mono text-xs">{entry.userId}</span>
                  <span className="font-mono text-xs text-muted">Lv {entry.level}</span>
                  <span className="font-mono text-sm font-semibold">{number(entry.totalXp)} XP</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className={panel}>
        <h2 className="border-b border-line px-5 py-4 font-mono text-xs uppercase tracking-[0.16em] text-muted">
          {t("admin.statBoosterList", { count: boosterList?.count ?? 0 })}
        </h2>

        {!boosterList || boosterList.list.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">
            {botReady ? t("admin.statNoBoosters") : t("admin.statsNoBot")}
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {boosterList.list.map((booster) => (
              <li key={booster.userId} className="flex flex-wrap items-center gap-3 px-5 py-2.5">
                <span className="min-w-0 flex-1 truncate font-mono text-xs">
                  {booster.displayName || booster.tag || booster.userId}
                </span>
                <span className="font-mono text-xs text-muted">
                  {booster.premiumSince
                    ? t("admin.statSince", {
                        date: new Date(booster.premiumSince).toLocaleDateString(locale === "id" ? "id-ID" : "en-GB"),
                      })
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs leading-relaxed text-muted">{t("admin.statsNote")}</p>
    </div>
  );
}
