import Link from "next/link";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { createTranslator } from "@/i18n/dictionary";
import { listOrdersByBuyer } from "@/lib/store";
import { btnPrimary, pageTop, panel, sectionLead, sectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const locale = await getLocale();
  const { t } = createTranslator(locale);
  const user = await getSession();

  if (!user) {
    return (
      <div className={pageTop}>
        <h1 className={sectionTitle}>{t("orders.title")}</h1>
        <p className={sectionLead}>{t("orders.lead")}</p>
        <a href={`/login?next=${encodeURIComponent("/orders")}`} className={`${btnPrimary} mt-6`}>
          {t("checkout.loginCta")}
        </a>
      </div>
    );
  }

  const orders = await listOrdersByBuyer(user.id);

  return (
    <div className={pageTop}>
      <h1 className={sectionTitle}>{t("orders.title")}</h1>
      <p className={sectionLead}>{t("orders.lead")}</p>

      {orders.length === 0 ? (
        <div className={`${panel} mt-8 px-5 py-12 text-center`}>
          <p className="text-sm text-muted">{t("orders.empty")}</p>
          <Link href="/shop" className={`${btnPrimary} mt-5`}>
            {t("orders.browse")}
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {orders.map((order) => (
            <li key={order.ref} className={`${panel} flex flex-wrap items-center gap-4 p-4`}>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-xs text-muted">{order.ref}</p>
                <p className="mt-1 truncate text-sm font-semibold">{order.productLabel}</p>
                <p className="mt-1 font-mono text-xs text-muted">
                  {order.productPrice} · {new Date(order.createdAt).toLocaleDateString(locale === "id" ? "id-ID" : "en-GB")}
                </p>
              </div>
              <OrderStatusBadge status={order.status} t={t} />
              <Link
                href={`/orders/${order.ref}`}
                className="rounded-card border border-line px-3 py-2 text-xs font-semibold transition hover:border-muted"
              >
                {t("orders.detail")}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
