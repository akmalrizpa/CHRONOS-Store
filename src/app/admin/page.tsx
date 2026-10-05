import Link from "next/link";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import { deliverOrderAction, rejectOrderAction, saveStaffNoteAction } from "@/app/actions/orders";
import { saveProductMetaAction, saveSettingsAction } from "@/app/actions/admin";
import { getStaffSession, isAuthConfigured } from "@/lib/auth";
import { getCatalog } from "@/lib/catalog";
import { getLocale } from "@/lib/locale";
import { createTranslator } from "@/i18n/dictionary";
import { getSettings, listOrders } from "@/lib/store";
import { isBotConfigured } from "@/lib/bot";
import { durationLabel } from "@/lib/price";
import type { OrderStatus } from "@/lib/types";
import { badgeDanger, badgeOk, btnPrimary, btnSoft, field, label, mono, pageTop, panel, sectionLead, sectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

const STATUSES: OrderStatus[] = ["pending", "review", "delivered", "rejected"];
const TABS = ["orders", "promos", "settings"] as const;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    status?: string;
    ref?: string;
    result?: string;
    error?: string;
    warning?: string;
    saved?: string;
  }>;
}) {
  const params = await searchParams;
  const locale = await getLocale();
  const { t } = createTranslator(locale);
  const staff = await getStaffSession();

  if (!staff) {
    return (
      <div className={pageTop}>
        <h1 className={sectionTitle}>{t("admin.title")}</h1>
        <p className={sectionLead}>{isAuthConfigured ? t("admin.notStaff") : t("login.notConfigured")}</p>
        {isAuthConfigured && (
          <a href={`/login?next=${encodeURIComponent("/admin")}`} className={`${btnPrimary} mt-6`}>
            {t("checkout.loginCta")}
          </a>
        )}
      </div>
    );
  }

  const tab = (TABS as readonly string[]).includes(params.tab ?? "") ? (params.tab as (typeof TABS)[number]) : "orders";
  const statusFilter = STATUSES.includes((params.status ?? "") as OrderStatus)
    ? (params.status as OrderStatus)
    : undefined;

  const messages: { kind: "ok" | "danger"; text: string }[] = [];
  if (params.result === "ok") messages.push({ kind: "ok", text: t("admin.resultOk") });
  if (params.result === "partial")
    messages.push({ kind: "danger", text: t("admin.resultPartial", { warning: params.warning ?? "" }) });
  if (params.result === "failed")
    messages.push({ kind: "danger", text: t("admin.deliveryFailed", { error: params.error ?? "" }) });
  if (params.result === "bot") messages.push({ kind: "danger", text: t("admin.botMissing") });
  if (params.result === "missing") messages.push({ kind: "danger", text: t("common.notFoundBody") });
  if (params.result === "already") messages.push({ kind: "danger", text: t("admin.resultOk") });
  if (params.result === "rejected") messages.push({ kind: "ok", text: t("order.status.rejected") });
  if (params.saved === "1") messages.push({ kind: "ok", text: t("admin.saved") });

  return (
    <div className={pageTop}>
      <h1 className={sectionTitle}>{t("admin.title")}</h1>
      <p className={sectionLead}>{t("admin.lead")}</p>

      <nav className="mt-8 flex flex-wrap gap-2 border-b border-line pb-3">
        {TABS.map((item) => (
          <Link
            key={item}
            href={`/admin?tab=${item}`}
            className={`rounded-card px-3 py-1.5 font-mono text-xs font-semibold transition ${
              tab === item ? "bg-accent text-ink" : "border border-line text-muted hover:text-paper"
            }`}
          >
            {t(`admin.tab${item.charAt(0).toUpperCase()}${item.slice(1)}`)}
          </Link>
        ))}
      </nav>

      {messages.length > 0 && (
        <ul className="mt-5 space-y-2">
          {messages.map((message) => (
            <li
              key={message.text}
              className={
                message.kind === "ok"
                  ? `${badgeOk} px-3 py-2 text-sm`
                  : `${badgeDanger} px-3 py-2 text-sm`
              }
            >
              {message.text}
            </li>
          ))}
        </ul>
      )}

      {tab === "orders" && (
        <OrdersTab
          t={t}
          locale={locale}
          statusFilter={statusFilter}
          highlight={params.ref}
          botReady={isBotConfigured}
        />
      )}

      {tab === "promos" && <PromosTab t={t} locale={locale} />}
      {tab === "settings" && <SettingsTab t={t} />}
    </div>
  );
}

async function OrdersTab({
  t,
  locale,
  statusFilter,
  highlight,
  botReady,
}: {
  t: ReturnType<typeof createTranslator>["t"];
  locale: "en" | "id";
  statusFilter?: OrderStatus;
  highlight?: string;
  botReady: boolean;
}) {
  const orders = await listOrders({ status: statusFilter, limit: 80 });

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/admin?tab=orders"
          className={`rounded-card px-3 py-1.5 font-mono text-xs font-semibold ${
            !statusFilter ? "bg-panel-2 text-paper" : "text-muted hover:text-paper"
          }`}
        >
          {t("admin.filterAll")}
        </Link>
        {STATUSES.map((status) => (
          <Link
            key={status}
            href={`/admin?tab=orders&status=${status}`}
            className={`rounded-card px-3 py-1.5 font-mono text-xs font-semibold ${
              statusFilter === status ? "bg-panel-2 text-paper" : "text-muted hover:text-paper"
            }`}
          >
            {t(`order.status.${status}`)}
          </Link>
        ))}
      </div>

      {!botReady && <p className={`${badgeDanger} mt-5 px-3 py-2 text-sm`}>{t("admin.botMissing")}</p>}

      {orders.length === 0 ? (
        <p className="mt-8 rounded-card border border-dashed border-line px-4 py-12 text-center text-sm text-muted">
          {t("admin.noOrders")}
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((order) => (
            <li
              key={order.ref}
              id={order.ref}
              className={`${panel} p-5 ${highlight === order.ref ? "border-accent" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-muted">{order.ref}</p>
                  <p className="mt-1 text-base font-semibold">{order.productLabel}</p>
                  <p className="mt-1 font-mono text-xs text-muted">
                    {order.productValue} · {order.productPrice} · {durationLabel(order.durationDays, locale)}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} t={t} />
              </div>

              <div className="mt-4 grid gap-3 border-t border-line pt-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted">{t("admin.buyer")}</p>
                  <p className="mt-1 font-mono text-xs">
                    {order.buyerUsername} · {order.buyerDiscordId}
                  </p>
                  {order.contact && <p className="mt-1 font-mono text-xs text-muted">{order.contact}</p>}
                </div>
                <div>
                  <p className="text-xs text-muted">{t("admin.proof")}</p>
                  {order.proofPath ? (
                    <a
                      href={`/api/proofs/${order.ref}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block font-mono text-xs text-accent transition hover:text-accent-dark"
                    >
                      {t("admin.openProof")}
                    </a>
                  ) : (
                    <p className="mt-1 text-xs text-muted">{t("admin.noProof")}</p>
                  )}
                  <p className="mt-1 font-mono text-xs text-muted">
                    {new Date(order.createdAt).toLocaleString(locale === "id" ? "id-ID" : "en-GB")}
                  </p>
                </div>
              </div>

              {order.note && (
                <p className="mt-4 border-t border-line pt-4 text-sm leading-relaxed text-muted">
                  <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted">{t("admin.note")}: </span>
                  {order.note}
                </p>
              )}

              {order.status !== "delivered" && (
                <div className="mt-5 grid gap-4 border-t border-line pt-5 lg:grid-cols-2">
                  <form action={deliverOrderAction} className="space-y-3">
                    <input type="hidden" name="ref" value={order.ref} />
                    <p className={label}>{t("admin.deliverTitle")}</p>
                    <input name="key" placeholder={t("admin.keyPlaceholder")} className={`${field} font-mono`} />
                    <p className="text-xs text-muted">{t("admin.keyLabel")}</p>
                    <button type="submit" className={btnPrimary}>
                      {t("admin.deliver")}
                    </button>
                  </form>

                  <form action={rejectOrderAction} className="space-y-3">
                    <input type="hidden" name="ref" value={order.ref} />
                    <p className={label}>{t("admin.reject")}</p>
                    <textarea name="reason" rows={2} maxLength={300} className={field} />
                    <p className="text-xs text-muted">{t("admin.rejectReason")}</p>
                    <button type="submit" className={btnSoft}>
                      {t("admin.reject")}
                    </button>
                  </form>
                </div>
              )}

              <form action={saveStaffNoteAction} className="mt-5 flex flex-wrap items-end gap-3 border-t border-line pt-5">
                <input type="hidden" name="ref" value={order.ref} />
                <div className="min-w-0 flex-1">
                  <label className={label} htmlFor={`note-${order.ref}`}>
                    {t("admin.staffNoteLabel")}
                  </label>
                  <input
                    id={`note-${order.ref}`}
                    name="staffNote"
                    defaultValue={order.staffNote ?? ""}
                    maxLength={400}
                    className={`${field} mt-2`}
                  />
                </div>
                <button type="submit" className={btnSoft}>
                  {t("admin.saveNote")}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

async function PromosTab({ t, locale }: { t: ReturnType<typeof createTranslator>["t"]; locale: "en" | "id" }) {
  const catalog = await getCatalog({ fresh: true });

  if (catalog.products.length === 0) {
    return <p className="mt-8 text-sm text-muted">{t("admin.noOrders")}</p>;
  }

  return (
    <div className="mt-8">
      <h2 className="text-base font-semibold">{t("admin.promoTitle")}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{t("admin.promoLead")}</p>

      <ul className="mt-6 divide-y divide-line border-y border-line">
        {catalog.products.map((product) => (
          <li key={product.value}>
            <form action={saveProductMetaAction} className="flex flex-wrap items-end gap-4 py-4">
              <input type="hidden" name="value" value={product.value} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{product.label}</p>
                <p className={`mt-1 text-xs text-muted ${mono}`}>
                  {product.value} · {product.categoryLabel} · {product.price} ·{" "}
                  {durationLabel(product.durationDays, locale)}
                </p>
              </div>
              <div>
                <label className={label} htmlFor={`promo-${product.value}`}>
                  {t("admin.promoLabel")}
                </label>
                <input
                  id={`promo-${product.value}`}
                  name="promoLabel"
                  defaultValue={product.promoLabel ?? ""}
                  placeholder={t("admin.promoPlaceholder")}
                  maxLength={24}
                  className={`${field} mt-2 w-40`}
                />
              </div>
              <label className="flex items-center gap-2 pb-2 text-sm">
                <input type="checkbox" name="featured" defaultChecked={product.featured} className="h-4 w-4" />
                {t("admin.featured")}
              </label>
              <button type="submit" className={btnSoft}>
                {t("admin.saveProduct")}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}

async function SettingsTab({ t }: { t: ReturnType<typeof createTranslator>["t"] }) {
  const settings = await getSettings();

  const textFields: { name: keyof typeof settings; label: string; hint?: string }[] = [
    { name: "qrisImageUrl", label: t("admin.qrisImageUrl"), hint: t("admin.qrisHint") },
    { name: "paymentNote", label: t("admin.paymentNote"), hint: t("admin.paymentNoteHint") },
    { name: "promoBanner", label: t("admin.promoBanner"), hint: t("admin.promoBannerHint") },
    { name: "supportHours", label: t("admin.supportHours") },
    { name: "discordInviteUrl", label: t("admin.discordInviteUrl") },
    { name: "whatsappUrl", label: t("admin.whatsappUrl") },
    { name: "telegramUrl", label: t("admin.telegramUrl") },
    { name: "currencyLabel", label: t("admin.currencyLabel"), hint: t("admin.currencyHint") },
  ];

  return (
    <form action={saveSettingsAction} className="mt-8 max-w-3xl space-y-6">
      <h2 className="text-base font-semibold">{t("admin.settingsTitle")}</h2>

      {textFields.map((item) => (
        <div key={item.name}>
          <label className={label} htmlFor={item.name}>
            {item.label}
          </label>
          <input
            id={item.name}
            name={item.name}
            defaultValue={String(settings[item.name] ?? "")}
            maxLength={500}
            className={`${field} mt-2`}
          />
          {item.hint && <p className="mt-1.5 text-xs text-muted">{item.hint}</p>}
        </div>
      ))}

      <label className="flex items-start gap-3 border-t border-line pt-5 text-sm">
        <input type="checkbox" name="storeOpen" defaultChecked={settings.storeOpen} className="mt-0.5 h-4 w-4" />
        <span>
          {t("admin.storeOpen")}
          <span className="mt-1 block text-xs text-muted">{t("admin.storeOpenHint")}</span>
        </span>
      </label>

      <button type="submit" className={btnPrimary}>
        {t("admin.saveSettings")}
      </button>
    </form>
  );
}
