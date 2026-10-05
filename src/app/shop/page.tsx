import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getCatalog } from "@/lib/catalog";
import { getLocale } from "@/lib/locale";
import { createTranslator } from "@/i18n/dictionary";
import { btnSoft, field, pageTop, sectionLead, sectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;
  const locale = await getLocale();
  const { t } = createTranslator(locale);
  const catalog = await getCatalog();

  const query = (params.q ?? "").trim();
  const category = params.category ?? "";
  const needle = query.toLowerCase();

  const filtered = catalog.products.filter(
    (product) =>
      (!category || product.category === category) &&
      (!needle || product.label.toLowerCase().includes(needle) || product.value.toLowerCase().includes(needle)),
  );

  const hasFilter = Boolean(query || category);

  return (
    <div className={pageTop}>
      <h1 className={sectionTitle}>{t("shop.title")}</h1>
      <p className={sectionLead}>{t("shop.lead")}</p>

      <form action="/shop" className="mt-8 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder={t("shop.search")}
          aria-label={t("shop.searchLabel")}
          className={field}
        />
        <select name="category" defaultValue={category} aria-label={t("shop.all")} className={`${field} sm:w-64`}>
          <option value="">{t("shop.all")}</option>
          {catalog.categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <button type="submit" className={btnSoft}>
          {t("shop.searchCta")}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <p className="font-mono text-xs text-muted">
          {t("shop.showing", { shown: filtered.length, total: catalog.products.length })}
        </p>
        {hasFilter && (
          <Link href="/shop" className="font-mono text-xs text-accent transition hover:text-accent-dark">
            {t("shop.reset")}
          </Link>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 rounded-card border border-dashed border-line px-4 py-12 text-center text-sm text-muted">
          {t("shop.empty", { query: query || t("shop.all") })}
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard key={`${product.category}-${product.value}`} product={product} t={t} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
