import Link from "next/link";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import { logoutAction } from "@/app/actions/session";
import { getSession, isStaffUser } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { createTranslator } from "@/i18n/dictionary";
import { getSettings, listOrdersByBuyer } from "@/lib/store";
import { formatAmount } from "@/lib/price";
import { btnOutline, btnPrimary, pageTop, panel, sectionLead, sectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const locale = await getLocale();
  const { t } = createTranslator(locale);
  const user = await getSession();

  if (!user) {
    return (
      <div className={pageTop}>
        <h1 className={sectionTitle}>{t("account.title")}</h1>
        <p className={sectionLead}>{t("account.lead")}</p>
        <a href={`/login?next=${encodeURIComponent("/account")}`} className={`${btnPrimary} mt-6`}>
          {t("checkout.loginCta")}
        </a>
      </div>
    );
  }

  const [orders, settings, staff] = await Promise.all([
    listOrdersByBuyer(user.id),
    getSettings(),
    isStaffUser(user.id),
  ]);

  const delivered = orders.filter((order) => order.status === "delivered");
  const spent = delivered.reduce((total, order) => total + (Number.isFinite(order.priceAmount) ? order.priceAmount : 0), 0);

  return (
    <div className={pageTop}>
      <h1 className={sectionTitle}>{t("account.title")}</h1>
      <p className={sectionLead}>{t("account.lead")}</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className={`${panel} self-start p-6`}>
          <div className="flex items-center gap-3">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="" className="h-12 w-12 rounded-full" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-panel-2 font-mono">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-base font-semibold">{user.displayName}</p>
              <p className="font-mono text-xs text-muted">{user.username}</p>
            </div>
          </div>

          <dl className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">{t("admin.custOrders", { count: orders.length })}</dt>
              <dd className="font-mono">{orders.length}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">{t("account.totalSpent")}</dt>
              <dd className="font-mono">{formatAmount(spent, settings.currencyLabel)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">{t("account.role")}</dt>
              <dd className="font-mono">{staff ? t("admin.custAdmin") : t("admin.custCustomer")}</dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-5">
            <Link href="/orders" className={btnPrimary}>
              {t("nav.orders")}
            </Link>
            {staff && (
              <Link href="/admin" className={btnOutline}>
                {t("nav.admin")}
              </Link>
            )}
            <form action={logoutAction}>
              <button type="submit" className={btnOutline}>
                {t("nav.logout")}
              </button>
            </form>
          </div>
        </section>

        <section className={`${panel} self-start`}>
          <h2 className="border-b border-line px-5 py-4 text-base font-semibold">{t("account.recentOrders")}</h2>

          {orders.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-muted">{t("orders.empty")}</p>
              <Link href="/shop" className={`${btnPrimary} mt-5`}>
                {t("orders.browse")}
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {orders.slice(0, 8).map((order) => (
                <li key={order.ref} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{order.productLabel}</p>
                    <p className="font-mono text-xs text-muted">
                      {order.ref} ·{" "}
                      {new Date(order.createdAt).toLocaleDateString(locale === "id" ? "id-ID" : "en-GB")}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} t={t} />
                  <Link
                    href={`/orders/${order.ref}`}
                    className="rounded-card border border-line px-3 py-1.5 text-xs font-semibold transition hover:border-muted"
                  >
                    {t("orders.detail")}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
