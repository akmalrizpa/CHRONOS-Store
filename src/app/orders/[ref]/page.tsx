import Link from "next/link";
import { notFound } from "next/navigation";
import CopyButton from "@/components/CopyButton";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import { uploadProofAction } from "@/app/actions/orders";
import { submitReviewAction } from "@/app/actions/reviews";
import { getSession, isStaff } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { createTranslator } from "@/i18n/dictionary";
import { getOrder, getReviewByOrder, getSettings } from "@/lib/store";
import { durationLabel } from "@/lib/price";
import {
  badgeDanger,
  badgeOk,
  btnOutline,
  btnPrimary,
  field,
  label,
  pageTop,
  panel,
  sectionTitle,
} from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ ref: string }>;
  searchParams: Promise<{ created?: string; upload?: string; review?: string }>;
}) {
  const { ref } = await params;
  const flags = await searchParams;

  const locale = await getLocale();
  const { t } = createTranslator(locale);

  const order = await getOrder(ref);
  if (!order) notFound();

  const user = await getSession();
  const staff = Boolean(user && isStaff(user.id));
  const owner = Boolean(user && order.buyerDiscordId === user.id);

  if (!owner && !staff) {
    return (
      <div className={pageTop}>
        <h1 className={sectionTitle}>{t("order.title")}</h1>
        <p className="mt-3 font-mono text-sm text-muted">{order.ref}</p>
        <p className="mt-6 text-sm leading-relaxed text-muted">{t("statusPage.signInToSeeKey")}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={`/login?next=${encodeURIComponent(`/orders/${order.ref}`)}`} className={btnPrimary}>
            {t("checkout.loginCta")}
          </a>
          <Link href={`/status?ref=${order.ref}`} className={btnOutline}>
            {t("order.track")}
          </Link>
        </div>
      </div>
    );
  }

  const [settings, review] = await Promise.all([getSettings(), getReviewByOrder(order.ref)]);
  const created = flags.created === "1";

  const messages: string[] = [];
  if (flags.upload === "ok") messages.push(t("order.uploadDone"));
  if (flags.upload === "empty") messages.push(t("order.uploadHint"));
  if (flags.upload === "error") messages.push(t("admin.deliveryFailed", { error: "upload" }));
  if (flags.upload === "locked") messages.push(t("order.keyHint"));
  if (flags.review === "ok") messages.push(t("reviews.formDone"));
  if (flags.review === "exists") messages.push(t("reviews.formExists"));

  return (
    <div className={pageTop}>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={staff ? "/admin?tab=orders" : "/orders"}
          className="font-mono text-xs text-muted transition hover:text-paper"
        >
          ← {staff ? t("admin.tabOrders") : t("order.backOrders")}
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={sectionTitle}>{order.productLabel}</h1>
          <p className="mt-2 font-mono text-sm text-muted">{order.ref}</p>
        </div>
        <OrderStatusBadge status={order.status} t={t} />
      </div>

      {messages.length > 0 && (
        <ul className="mt-6 space-y-2">
          {messages.map((message) => (
            <li key={message} className="rounded-card border border-line bg-panel px-4 py-2.5 text-sm text-muted">
              {message}
            </li>
          ))}
        </ul>
      )}

      {created && (
        <p className={`${badgeOk} mt-6 px-3 py-2`}>{t("order.payTitle")}</p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.8fr]">
        <div className="space-y-6">
          {order.status === "delivered" && order.deliveredKey && (
            <section className={`${panel} p-6`}>
              <h2 className="text-base font-semibold">{t("order.keyTitle")}</h2>
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-card border border-line bg-panel-2 p-4">
                <code className="font-mono text-sm break-all">{order.deliveredKey}</code>
                <CopyButton value={order.deliveredKey} labels={{ copy: t("order.copy"), copied: t("order.copied") }} />
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted">{t("order.keyHint")}</p>
              {order.deliveredBy && (
                <p className="mt-2 font-mono text-xs text-muted">
                  {t("admin.deliveredBy", { name: order.deliveredBy })}
                </p>
              )}
            </section>
          )}

          {order.status === "rejected" && (
            <section className={`${panel} p-6`}>
              <h2 className="text-base font-semibold">{t("order.rejectedBody")}</h2>
              {order.staffNote && (
                <>
                  <p className="mt-4 font-mono text-xs uppercase tracking-[0.16em] text-muted">{t("order.staffNote")}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{order.staffNote}</p>
                </>
              )}
              {settings.discordInviteUrl && (
                <a href={settings.discordInviteUrl} target="_blank" rel="noreferrer" className={`${btnOutline} mt-5`}>
                  {t("order.supportCta")}
                </a>
              )}
            </section>
          )}

          {(order.status === "pending" || order.status === "review") && (
            <section className={`${panel} p-6`}>
              <h2 className="text-base font-semibold">{t("order.payTitle")}</h2>

              <div className="mt-5">
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">{t("order.qrisTitle")}</p>
                {settings.qrisImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={settings.qrisImageUrl}
                    alt="QRIS"
                    className="mt-3 w-full max-w-xs rounded-card border border-line bg-white p-2"
                  />
                ) : (
                  <p className="mt-2 text-sm leading-relaxed text-muted">{t("order.qrisMissing")}</p>
                )}
                {settings.paymentNote && (
                  <p className="mt-3 text-sm leading-relaxed text-muted">{settings.paymentNote}</p>
                )}
              </div>

              <div className="mt-6 border-t border-line pt-5">
                <p className={label}>{t("order.uploadLabel")}</p>
                <form action={uploadProofAction} encType="multipart/form-data" className="mt-3 space-y-3">
                  <input type="hidden" name="ref" value={order.ref} />
                  <input
                    type="file"
                    name="proof"
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    className={`${field} file:mr-3 file:rounded-card file:border-0 file:bg-panel file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-paper`}
                  />
                  <p className="text-xs text-muted">{t("order.uploadHint")}</p>
                  <button type="submit" className={btnPrimary}>
                    {t("order.uploadCta")}
                  </button>
                </form>

                {order.proofPath && (
                  <p className="mt-4 flex flex-wrap items-center gap-3 font-mono text-xs text-muted">
                    {t("order.proofTitle")}:
                    <a
                      href={`/api/proofs/${order.ref}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent transition hover:text-accent-dark"
                    >
                      {order.proofPath.split("/").pop()}
                    </a>
                  </p>
                )}
              </div>

              <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-muted">
                {t("checkout.gatewaySoon")}
              </p>
            </section>
          )}

          {order.status === "review" && (
            <section className={`${panel} p-6`}>
              <h2 className="text-base font-semibold">{t("order.waitingTitle")}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t("order.waitingBody")}</p>
            </section>
          )}

          {order.status === "delivered" && (
            <section className={`${panel} p-6`}>
              {review ? (
                <>
                  <h2 className="text-base font-semibold">{t("reviews.formTitle")}</h2>
                  <p className="mt-2 font-mono text-xs text-accent">{t("reviews.stars", { rating: review.rating })}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{review.body}</p>
                </>
              ) : (
                <>
                  <h2 className="text-base font-semibold">{t("reviews.formTitle")}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{t("reviews.formHint")}</p>
                  <form action={submitReviewAction} className="mt-5 space-y-4">
                    <input type="hidden" name="ref" value={order.ref} />
                    <div>
                      <label className={label} htmlFor="rating">
                        {t("reviews.rating")}
                      </label>
                      <select id="rating" name="rating" defaultValue="5" className={`${field} mt-2 sm:w-32`}>
                        {[5, 4, 3, 2, 1].map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={label} htmlFor="body">
                        {t("reviews.formBody")}
                      </label>
                      <textarea id="body" name="body" rows={3} maxLength={600} className={`${field} mt-2`} />
                    </div>
                    <button type="submit" className={btnPrimary}>
                      {t("reviews.formSubmit")}
                    </button>
                  </form>
                </>
              )}
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <section className={`${panel} p-6`}>
            <dl className="text-sm">
              <div className="flex items-center justify-between gap-4 border-b border-line py-2.5">
                <dt className="text-muted">{t("checkout.product")}</dt>
                <dd className="text-right font-mono text-xs">{order.productValue}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-line py-2.5">
                <dt className="text-muted">{t("checkout.price")}</dt>
                <dd className="font-mono font-semibold">{order.productPrice || "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-line py-2.5">
                <dt className="text-muted">{t("checkout.duration")}</dt>
                <dd className="font-mono">{durationLabel(order.durationDays, locale)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-2.5">
                <dt className="text-muted">{t("order.createdAt")}</dt>
                <dd className="font-mono text-xs">
                  {new Date(order.createdAt).toLocaleString(locale === "id" ? "id-ID" : "en-GB")}
                </dd>
              </div>
            </dl>

            {order.contact && (
              <p className="mt-4 border-t border-line pt-4 font-mono text-xs text-muted">{order.contact}</p>
            )}
            {order.note && <p className="mt-2 text-xs leading-relaxed text-muted">{order.note}</p>}
          </section>

          <section className={`${panel} p-6`}>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">{t("order.statusLabel")}</p>
            <ul className="mt-4 space-y-3">
              {order.events.map((event) => (
                <li key={`${event.at}-${event.label}`} className="border-t border-line pt-3 first:border-0 first:pt-0">
                  <p className="text-xs text-muted">{event.label}</p>
                  <p className="mt-1 font-mono text-xs text-muted/70">
                    {new Date(event.at).toLocaleString(locale === "id" ? "id-ID" : "en-GB")}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {settings.supportHours && (
            <p className="text-xs leading-relaxed text-muted">
              {t("footer.support")}: <span className="font-mono">{settings.supportHours}</span>
            </p>
          )}

          {order.status === "rejected" && <span className={badgeDanger}>{t("order.status.rejected")}</span>}
        </aside>
      </div>
    </div>
  );
}
