import Link from "next/link";
import { notFound } from "next/navigation";
import { createOrderAction } from "@/app/actions/orders";
import { getCatalog } from "@/lib/catalog";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { createTranslator } from "@/i18n/dictionary";
import { getSettings } from "@/lib/store";
import { durationLabel } from "@/lib/price";
import { badgeDanger, btnOutline, btnPrimary, field, label, pageTop, panel, sectionLead, sectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ value: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { value } = await params;
  const { error } = await searchParams;
  const productValue = decodeURIComponent(value);

  const locale = await getLocale();
  const { t } = createTranslator(locale);

  const [catalog, settings, user] = await Promise.all([getCatalog(), getSettings(), getSession()]);
  const product = catalog.products.find((item) => item.value === productValue);

  if (!product) notFound();

  const loginHref = `/login?next=${encodeURIComponent(`/checkout/${productValue}`)}`;

  return (
    <div className={pageTop}>
      <h1 className={sectionTitle}>{t("checkout.title")}</h1>
      <p className={sectionLead}>{t("checkout.lead")}</p>

      {error === "closed" && (
        <p className={`${badgeDanger} mt-6 px-3 py-2`}>{t("checkout.closed")}</p>
      )}
      {error === "failed" && (
        <p className={`${badgeDanger} mt-6 px-3 py-2`}>Order tidak tersimpan / could not be saved.</p>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_0.85fr]">
        <div className={`${panel} p-6`}>
          {!user ? (
            <>
              <h2 className="text-base font-semibold">{t("checkout.loginTitle")}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t("checkout.loginBody")}</p>
              <a href={loginHref} className={`${btnPrimary} mt-5`}>
                {t("checkout.loginCta")}
              </a>
            </>
          ) : !settings.storeOpen ? (
            <p className="text-sm leading-relaxed text-muted">{t("checkout.closed")}</p>
          ) : (
            <form action={createOrderAction} className="space-y-5">
              <input type="hidden" name="value" value={product.value} />

              <div className="flex items-center gap-3 border-b border-line pb-5">
                {user.avatarUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt="" className="h-9 w-9 rounded-full" />
                )}
                <div>
                  <p className="text-sm font-semibold">{user.displayName}</p>
                  <p className="font-mono text-xs text-muted">{user.username}</p>
                </div>
              </div>

              <div>
                <label className={label} htmlFor="contact">
                  {t("checkout.contact")} <span className="normal-case tracking-normal">({t("common.optional")})</span>
                </label>
                <input id="contact" name="contact" maxLength={120} className={`${field} mt-2`} />
                <p className="mt-1.5 text-xs text-muted">{t("checkout.contactHint")}</p>
              </div>

              <div>
                <label className={label} htmlFor="note">
                  {t("checkout.note")} <span className="normal-case tracking-normal">({t("common.optional")})</span>
                </label>
                <textarea id="note" name="note" rows={3} maxLength={400} className={`${field} mt-2`} />
                <p className="mt-1.5 text-xs text-muted">{t("checkout.noteHint")}</p>
              </div>

              <button type="submit" className={`${btnPrimary} w-full sm:w-auto`}>
                {t("checkout.submit")}
              </button>
            </form>
          )}
        </div>

        <aside className={`${panel} self-start p-6`}>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">{product.categoryLabel}</p>
          <h2 className="mt-3 text-lg font-semibold">{product.label}</h2>

          <dl className="mt-5 border-t border-line text-sm">
            <div className="flex items-center justify-between gap-4 border-b border-line py-3">
              <dt className="text-muted">{t("checkout.price")}</dt>
              <dd className="font-mono text-base font-semibold">{product.price || "—"}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-line py-3">
              <dt className="text-muted">{t("checkout.duration")}</dt>
              <dd className="font-mono">{durationLabel(product.durationDays, locale)}</dd>
            </div>
          </dl>

          <div className="mt-4 border-t border-line pt-4">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">{t("checkout.paymentTitle")}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted">{t("checkout.gatewaySoon")}</p>
          </div>

          <Link href={`/products/${encodeURIComponent(product.value)}`} className={`${btnOutline} mt-5`}>
            {t("product.back")}
          </Link>
        </aside>
      </div>
    </div>
  );
}
