import Link from "next/link";
import { getCatalog, getBotHealth } from "@/lib/catalog";
import { getLocale } from "@/lib/locale";
import { createTranslator } from "@/i18n/dictionary";
import {
  countCustomers,
  countOrders,
  countReviews,
  getSettings,
  listActivity,
  listOrders,
  sumRevenue,
} from "@/lib/store";
import { isBotConfigured } from "@/lib/bot";
import { formatAmount } from "@/lib/price";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import { badgeDanger, btnOutline, btnPrimary, panel } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const locale = await getLocale();
  const { t } = createTranslator(locale);

  const [catalog, settings, health, pending, review, delivered, rejected, revenue, customers, reviews] =
    await Promise.all([
      getCatalog(),
      getSettings(),
      getBotHealth(),
      countOrders("pending"),
      countOrders("review"),
      countOrders("delivered"),
      countOrders("rejected"),
      sumRevenue(),
      countCustomers(),
      countReviews(),
    ]);

  const recent = await listOrders({ limit: 6 });
  const activity = await listActivity({ limit: 6 });
  const number = (value: number) => value.toLocaleString(locale === "id" ? "id-ID" : "en-US");

  const stats = [
    { id: "pending", label: t("admin.statPending"), value: number(pending), tone: "text-muted" },
    { id: "review", label: t("admin.statReview"), value: number(review), tone: "text-accent" },
    { id: "delivered", label: t("admin.statDelivered"), value: number(delivered), tone: "text-ok" },
    { id: "rejected", label: t("admin.statRejected"), value: number(rejected), tone: "text-danger" },
  ];

  return (
    <div className="space-y-10">
      {!isBotConfigured && <p className={`${badgeDanger} px-3 py-2 text-sm`}>{t("admin.botMissing")}</p>}

      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.id} className={`${panel} p-5`}>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">{stat.label}</p>
              <p className={`mt-2 font-mono text-2xl font-semibold ${stat.tone}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className={`${panel} p-5`}>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">{t("admin.statRevenue")}</p>
            <p className="mt-2 font-mono text-lg font-semibold">{formatAmount(revenue, settings.currencyLabel)}</p>
          </div>
          <div className={`${panel} p-5`}>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">{t("admin.statProducts")}</p>
            <p className="mt-2 font-mono text-lg font-semibold">{number(catalog.products.length)}</p>
          </div>
          <div className={`${panel} p-5`}>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">{t("admin.statCustomers")}</p>
            <p className="mt-2 font-mono text-lg font-semibold">{number(customers)}</p>
          </div>
          <div className={`${panel} p-5`}>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">{t("admin.statReviews")}</p>
            <p className="mt-2 font-mono text-lg font-semibold">{number(reviews)}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className={panel}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h2 className="text-base font-semibold">{t("admin.recentOrders")}</h2>
            <Link href="/admin/orders" className="font-mono text-xs text-accent transition hover:text-accent-dark">
              {t("admin.viewAll")}
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">{t("admin.noOrders")}</p>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((order) => (
                <li key={order.ref} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{order.productLabel}</p>
                    <p className="font-mono text-xs text-muted">
                      {order.ref} · {order.buyerUsername}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-muted">{order.productPrice}</span>
                  <OrderStatusBadge status={order.status} t={t} />
                  <Link
                    href={`/admin/orders?ref=${order.ref}`}
                    className="rounded-card border border-line px-3 py-1.5 text-xs font-semibold transition hover:border-muted"
                  >
                    {t("orders.detail")}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <div className={`${panel} p-5`}>
            <h2 className="text-base font-semibold">{t("admin.botCardTitle")}</h2>
            <p className="mt-2 font-mono text-xs text-muted">
              {health ? t("common.botOnline", { version: health.version }) : t("common.botOffline")}
            </p>
            <p className="mt-1 font-mono text-xs text-muted">
              {catalog.source === "bot"
                ? t("home.catalogLive", { count: catalog.products.length })
                : t("home.catalogDemo")}
            </p>
            <p className="mt-1 font-mono text-xs text-muted">
              {catalog.categories.length} {t("admin.statCategories")}
            </p>
          </div>

          <div className={`${panel} p-5`}>
            <h2 className="text-base font-semibold">{t("admin.quickActions")}</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/admin/products" className={btnPrimary}>
                {t("admin.navProducts")}
              </Link>
              <Link href="/admin/settings" className={btnOutline}>
                {t("admin.navSettings")}
              </Link>
              <Link href="/" className={btnOutline}>
                {t("nav.shop")}
              </Link>
            </div>
          </div>

          <div className={panel}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
              <h2 className="text-base font-semibold">{t("admin.recentActivity")}</h2>
              <Link href="/admin/log" className="font-mono text-xs text-accent transition hover:text-accent-dark">
                {t("admin.viewAll")}
              </Link>
            </div>

            {activity.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted">{t("admin.logEmpty")}</p>
            ) : (
              <ul className="divide-y divide-line">
                {activity.map((entry) => (
                  <li key={entry.id} className="px-5 py-3">
                    <p className="font-mono text-xs text-muted">
                      {new Date(entry.at).toLocaleString(locale === "id" ? "id-ID" : "en-GB", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="mt-1 text-sm">
                      <span className="font-mono text-xs text-accent">{entry.action}</span>{" "}
                      <span className="font-mono text-xs text-muted">{entry.target}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {entry.detail ? `${entry.detail} · ` : ""}
                      {entry.actorName}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <p className="text-xs leading-relaxed text-muted">{t("admin.productsNote")}</p>
    </div>
  );
}
