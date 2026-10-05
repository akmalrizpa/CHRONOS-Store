import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalog } from "@/lib/catalog";
import { getLocale } from "@/lib/locale";
import { createTranslator } from "@/i18n/dictionary";
import { getSettings } from "@/lib/store";
import { durationLabel } from "@/lib/price";
import { badgeMuted, badgePromo, btnOutline, btnPrimary, pageTop, panel, sectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ value: string }> }) {
  const { value } = await params;
  const productValue = decodeURIComponent(value);

  const locale = await getLocale();
  const { t } = createTranslator(locale);
  const [catalog, settings] = await Promise.all([getCatalog(), getSettings()]);
  const product = catalog.products.find((item) => item.value === productValue);

  if (!product) notFound();

  return (
    <div className={pageTop}>
      <Link href="/shop" className="font-mono text-xs text-muted transition hover:text-paper">
        ← {t("product.back")}
      </Link>

      <div className="mt-6 grid gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">{product.categoryLabel}</p>
            {product.promoLabel && <span className={badgePromo}>{product.promoLabel}</span>}
            <span className={badgeMuted}>{durationLabel(product.durationDays, locale)}</span>
          </div>

          <h1 className={`${sectionTitle} mt-4`}>{product.label}</h1>

          <dl className="mt-8 border-t border-line">
            <div className="flex items-center justify-between gap-4 border-b border-line py-3">
              <dt className="text-sm text-muted">{t("product.price")}</dt>
              <dd className="font-mono text-lg font-semibold">{product.price || "—"}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-line py-3">
              <dt className="text-sm text-muted">{t("product.duration")}</dt>
              <dd className="font-mono text-sm">{durationLabel(product.durationDays, locale)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-line py-3">
              <dt className="text-sm text-muted">{t("product.category")}</dt>
              <dd className="font-mono text-sm">{product.categoryLabel}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-line py-3">
              <dt className="text-sm text-muted">ID</dt>
              <dd className="font-mono text-sm text-muted">{product.value}</dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/checkout/${encodeURIComponent(product.value)}`} className={btnPrimary}>
              {t("product.buy")}
            </Link>
            {settings.discordInviteUrl && (
              <a href={settings.discordInviteUrl} target="_blank" rel="noreferrer" className={btnOutline}>
                {t("home.ctaDiscord")}
              </a>
            )}
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">{t("product.loginNote")}</p>
        </div>

        <aside className={`${panel} self-start p-6`}>
          <h2 className="text-base font-semibold">{t("product.deliveryTitle")}</h2>
          <ol className="mt-5 space-y-4">
            {["delivery1", "delivery2", "delivery3"].map((key, index) => (
              <li key={key} className="flex gap-4 border-t border-line pt-4 first:border-0 first:pt-0">
                <span className="font-mono text-sm text-accent">{String(index + 1).padStart(2, "0")}</span>
                <p className="text-sm leading-relaxed text-muted">{t(`product.${key}`)}</p>
              </li>
            ))}
          </ol>

          <p className="mt-6 border-t border-line pt-4 text-xs leading-relaxed text-muted">
            {product.autoRole ? t("product.roleNote") : t("product.noRoleNote")}
          </p>
        </aside>
      </div>
    </div>
  );
}
