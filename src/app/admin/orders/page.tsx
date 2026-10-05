import Link from "next/link";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import { deliverOrderAction, rejectOrderAction, saveStaffNoteAction } from "@/app/actions/orders";
import { getLocale } from "@/lib/locale";
import { createTranslator } from "@/i18n/dictionary";
import { listOrders } from "@/lib/store";
import { isBotConfigured } from "@/lib/bot";
import { durationLabel } from "@/lib/price";
import type { OrderStatus } from "@/lib/types";
import { badgeDanger, badgeOk, btnPrimary, btnSoft, field, label, mono, panel } from "@/components/ui";

export const dynamic = "force-dynamic";

const STATUSES: OrderStatus[] = ["pending", "review", "delivered", "rejected"];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    ref?: string;
    result?: string;
    error?: string;
    warning?: string;
  }>;
}) {
  const params = await searchParams;
  const locale = await getLocale();
  const { t } = createTranslator(locale);

  const statusFilter = STATUSES.includes((params.status ?? "") as OrderStatus)
    ? (params.status as OrderStatus)
    : undefined;

  const orders = await listOrders({ status: statusFilter, limit: 80 });

  const messages: { kind: "ok" | "danger"; text: string }[] = [];
  if (params.result === "ok") messages.push({ kind: "ok", text: t("admin.resultOk") });
  if (params.result === "partial")
    messages.push({ kind: "danger", text: t("admin.resultPartial", { warning: params.warning ?? "" }) });
  if (params.result === "failed")
    messages.push({ kind: "danger", text: t("admin.deliveryFailed", { error: params.error ?? "" }) });
  if (params.result === "bot") messages.push({ kind: "danger", text: t("admin.botMissing") });
  if (params.result === "missing") messages.push({ kind: "danger", text: t("common.notFoundBody") });
  if (params.result === "rejected") messages.push({ kind: "ok", text: t("order.status.rejected") });
  if (params.result === "saved") messages.push({ kind: "ok", text: t("admin.saved") });
  if (params.result === "demo") messages.push({ kind: "danger", text: t("demo.readOnly") });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/admin/orders"
          className={`rounded-card px-3 py-1.5 font-mono text-xs font-semibold ${
            !statusFilter ? "bg-panel-2 text-paper" : "text-muted hover:text-paper"
          }`}
        >
          {t("admin.filterAll")}
        </Link>
        {STATUSES.map((status) => (
          <Link
            key={status}
            href={`/admin/orders?status=${status}`}
            className={`rounded-card px-3 py-1.5 font-mono text-xs font-semibold ${
              statusFilter === status ? "bg-panel-2 text-paper" : "text-muted hover:text-paper"
            }`}
          >
            {t(`order.status.${status}`)}
          </Link>
        ))}
      </div>

      {messages.length > 0 && (
        <ul className="mt-5 space-y-2">
          {messages.map((message) => (
            <li
              key={message.text}
              className={message.kind === "ok" ? `${badgeOk} px-3 py-2 text-sm` : `${badgeDanger} px-3 py-2 text-sm`}
            >
              {message.text}
            </li>
          ))}
        </ul>
      )}

      {!isBotConfigured && <p className={`${badgeDanger} mt-5 px-3 py-2 text-sm`}>{t("admin.botMissing")}</p>}

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
              className={`${panel} p-5 ${params.ref === order.ref ? "border-accent" : ""}`}
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

              <p className={`mt-3 text-xs text-muted ${mono}`}>
                <Link href={`/orders/${order.ref}`} className="text-accent transition hover:text-accent-dark">
                  {t("admin.openOrderPage")}
                </Link>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
