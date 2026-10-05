import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getCatalog } from "@/lib/catalog";
import { getLocale } from "@/lib/locale";
import { createTranslator } from "@/i18n/dictionary";
import { countOrders, countReviews, getSettings, listReviews } from "@/lib/store";
import { durationLabel } from "@/lib/price";
import { WHY_US } from "@/data/shop";
import { btnOutline, btnPrimary, eyebrow, pageShell, panel, sectionLead, sectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const locale = await getLocale();
  const { t } = createTranslator(locale);

  const [catalog, settings, delivered, reviewCount, latestReviews] = await Promise.all([
    getCatalog(),
    getSettings(),
    countOrders("delivered"),
    countReviews(),
    listReviews(3),
  ]);

  const featured = catalog.products.filter((product) => product.featured);
  const showcase = (featured.length > 0 ? featured : catalog.products).slice(0, 6);
  const number = (value: number) => value.toLocaleString(locale === "id" ? "id-ID" : "en-US");

  return (
    <div>
      {settings.promoBanner && (
        <div className="border-b border-line bg-accent-soft">
          <p className={`${pageShell} py-2.5 text-center font-mono text-xs text-accent sm:text-sm`}>
            {settings.promoBanner}
          </p>
        </div>
      )}

      {catalog.source === "demo" && (
        <div className="border-b border-line bg-panel">
          <p className={`${pageShell} py-2.5 text-xs text-muted sm:text-sm`}>
            <span className="font-mono font-semibold text-accent">{t("common.demoCatalog")}</span>{" "}
            {t("common.demoCatalogBody")}
          </p>
        </div>
      )}

      <section className={`${pageShell} grid gap-12 pt-12 pb-14 sm:pt-16 lg:grid-cols-[1.1fr_0.9fr]`}>
        <div>
          <p className={eyebrow}>{t("home.eyebrow")}</p>
          <h1 className="mt-4 text-3xl leading-[1.12] font-semibold sm:text-5xl">{t("home.title")}</h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">{t("home.lead")}</p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/shop" className={btnPrimary}>
              {t("home.ctaShop")}
            </Link>
            {settings.discordInviteUrl && (
              <a href={settings.discordInviteUrl} target="_blank" rel="noreferrer" className={btnOutline}>
                {t("home.ctaDiscord")}
              </a>
            )}
          </div>

          <p className="mt-6 max-w-xl text-sm leading-relaxed text-muted">{t("home.openShopNote")}</p>
        </div>

        <aside className={`${panel} self-start p-5 sm:p-6`}>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">{t("home.quality")}</p>
          <p className="mt-3 text-lg font-semibold">{catalog.guildName}</p>
          <p className="mt-1 font-mono text-xs text-muted">
            {catalog.source === "bot" ? t("home.catalogLive", { count: catalog.products.length }) : t("home.catalogDemo")}
          </p>

          <dl className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">{t("stats.members")}</dt>
              <dd className="font-mono">{catalog.memberCount ? number(catalog.memberCount) : "—"}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">{t("stats.delivered")}</dt>
              <dd className="font-mono">{number(delivered)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">{t("stats.reviews")}</dt>
              <dd className="font-mono">{number(reviewCount)}</dd>
            </div>
          </dl>

          {catalog.products[0] && (
            <p className="mt-6 border-t border-line pt-5 text-xs leading-relaxed text-muted">
              {catalog.products[0].label} · {durationLabel(catalog.products[0].durationDays, locale)} ·{" "}
              {catalog.products[0].price}
            </p>
          )}
        </aside>
      </section>

      <section className="border-y border-line bg-panel">
        <div className={`${pageShell} py-14`}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className={sectionTitle}>{t("popular.title")}</h2>
              <p className={sectionLead}>{t("popular.lead")}</p>
            </div>
            <Link href="/shop" className="text-sm font-semibold text-accent transition hover:text-accent-dark">
              {t("popular.all")}
            </Link>
          </div>

          {showcase.length === 0 ? (
            <p className="mt-8 rounded-card border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
              {t("popular.empty")}
            </p>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {showcase.map((product) => (
                <ProductCard key={product.value} product={product} t={t} locale={locale} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className={`${pageShell} py-14`}>
        <h2 className={sectionTitle}>{t("why.title")}</h2>
        <p className={sectionLead}>{t("why.lead")}</p>

        <div className="mt-10 grid gap-x-12 gap-y-8 sm:grid-cols-3">
          {WHY_US.map((item, index) => (
            <article key={item.id} className="border-t border-line pt-5">
              <p className="font-mono text-xs text-accent">{String(index + 1).padStart(2, "0")}</p>
              <h3 className="mt-2 text-base font-semibold">{t(`why.${item.id}.title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t(`why.${item.id}.body`)}</p>
            </article>
          ))}
        </div>
      </section>

      {latestReviews.length > 0 && (
        <section className="border-y border-line bg-panel">
          <div className={`${pageShell} py-14`}>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className={sectionTitle}>{t("reviews.title")}</h2>
              <Link href="/reviews" className="text-sm font-semibold text-accent transition hover:text-accent-dark">
                {t("nav.reviews")}
              </Link>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {latestReviews.map((review) => (
                <blockquote key={review.id} className={`${panel} p-5`}>
                  <p className="font-mono text-xs text-accent">{t("reviews.stars", { rating: review.rating })}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{review.body}</p>
                  <footer className="mt-4 font-mono text-xs text-muted">
                    {t("reviews.from", { name: review.buyerUsername })} · {review.productLabel}
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className={`${pageShell} py-14`}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className={sectionTitle}>{t("nav.shop")}</h2>
            <p className={sectionLead}>{t("shop.lead")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/shop" className={btnPrimary}>
              {t("home.ctaShop")}
            </Link>
            {settings.discordInviteUrl && (
              <a href={settings.discordInviteUrl} target="_blank" rel="noreferrer" className={btnOutline}>
                {t("home.ctaDiscord")}
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
