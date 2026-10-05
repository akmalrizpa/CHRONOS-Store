import Link from "next/link";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { createTranslator } from "@/i18n/dictionary";
import { getOrder } from "@/lib/store";
import { btnPrimary, btnSoft, field, pageTop, panel, sectionLead, sectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function StatusPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  const locale = await getLocale();
  const { t } = createTranslator(locale);

  const wanted = (ref ?? "").trim().toUpperCase();
  const [order, user] = await Promise.all([wanted ? getOrder(wanted) : Promise.resolve(null), getSession()]);
  const owner = Boolean(order && user && order.buyerDiscordId === user.id);

  return (
    <div className={pageTop}>
      <h1 className={sectionTitle}>{t("statusPage.title")}</h1>
      <p className={sectionLead}>{t("statusPage.lead")}</p>

      <form action="/status" className="mt-8 flex flex-col gap-3 sm:flex-row">
        <input
          name="ref"
          defaultValue={wanted}
          placeholder="CS-XXXXXX"
          aria-label={t("statusPage.label")}
          className={`${field} font-mono uppercase sm:max-w-xs`}
        />
        <button type="submit" className={btnSoft}>
          {t("statusPage.submit")}
        </button>
      </form>

      {wanted && !order && (
        <p className="mt-6 rounded-card border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
          {t("statusPage.notFound")}
        </p>
      )}

      {order && (
        <div className={`${panel} mt-8 p-6`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-sm text-muted">{order.ref}</p>
              <p className="mt-1 text-base font-semibold">{order.productLabel}</p>
            </div>
            <OrderStatusBadge status={order.status} t={t} />
          </div>

          <dl className="mt-6 grid gap-3 border-t border-line pt-5 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted">{t("checkout.price")}</dt>
              <dd className="font-mono">{order.productPrice || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">{t("order.createdAt")}</dt>
              <dd className="font-mono text-xs">
                {new Date(order.createdAt).toLocaleString(locale === "id" ? "id-ID" : "en-GB")}
              </dd>
            </div>
            <div>
              <dt className="text-muted">{t("checkout.duration")}</dt>
              <dd className="font-mono">{order.durationDays > 0 ? `${order.durationDays}d` : "∞"}</dd>
            </div>
          </dl>

          <div className="mt-6 border-t border-line pt-5">
            {owner ? (
              <Link href={`/orders/${order.ref}`} className={btnPrimary}>
                {t("orders.detail")}
              </Link>
            ) : (
              <a href={`/login?next=${encodeURIComponent(`/orders/${order.ref}`)}`} className={btnPrimary}>
                {t("statusPage.signInToSeeKey")}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
