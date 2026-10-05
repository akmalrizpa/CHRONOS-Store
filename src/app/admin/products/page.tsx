import Link from "next/link";
import {
  createCategoryAction,
  createProductAction,
  deleteCategoryAction,
  deleteProductAction,
  updateCategoryAction,
  updateProductAction,
} from "@/app/actions/admin";
import { CategorySelect, PriceInput, RoleSelect, StyleSelect } from "@/components/admin/forms";
import { fetchMeta, isBotConfigured } from "@/lib/bot";
import { getCatalog } from "@/lib/catalog";
import { getLocale } from "@/lib/locale";
import { createTranslator } from "@/i18n/dictionary";
import { durationLabel, formatAmount, parsePrice } from "@/lib/price";
import { getSettings } from "@/lib/store";
import type { CatalogProduct } from "@/lib/types";
import {
  badgeDanger,
  badgeMuted,
  badgeOk,
  badgePromo,
  btnDanger,
  btnPrimary,
  field,
  label,
  panel,
} from "@/components/ui";

export const dynamic = "force-dynamic";

const PRODUCT_LIMIT = 25;
const CATEGORY_LIMIT = 25;

const RESULT_KEYS: Record<string, string> = {
  created: "admin.prodCreated",
  updated: "admin.prodUpdated",
  deleted: "admin.prodDeleted",
  categoryCreated: "admin.catCreated",
  categoryUpdated: "admin.catUpdated",
  categoryDeleted: "admin.catDeleted",
  nolabel: "admin.prodNoLabel",
  missing: "admin.prodMissing",
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; result?: string; error?: string; value?: string }>;
}) {
  const params = await searchParams;
  const locale = await getLocale();
  const { t } = createTranslator(locale);

  const [catalog, meta, settings] = await Promise.all([getCatalog({ fresh: true }), fetchMeta(), getSettings()]);
  const roles = meta.ok ? meta.data.roles : [];
  const categories = catalog.categories;
  const products = catalog.products;

  const tab = params.tab === "categories" ? "categories" : "products";
  const botReady = isBotConfigured;

  const message = params.result ? RESULT_KEYS[params.result] : undefined;

  const pricePreview = (product?: CatalogProduct) => {
    if (!product) return undefined;
    const parsed = parsePrice(product.price);
    return parsed.readable
      ? t("admin.prodPriceReads", { amount: formatAmount(parsed.amount, settings.currencyLabel) })
      : t("admin.prodPriceUnreadable");
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/products"
            className={`rounded-card px-3 py-1.5 font-mono text-xs font-semibold ${
              tab === "products" ? "bg-panel-2 text-paper" : "text-muted hover:text-paper"
            }`}
          >
            {t("admin.navProducts")} · {products.length}/{PRODUCT_LIMIT}
          </Link>
          <Link
            href="/admin/products?tab=categories"
            className={`rounded-card px-3 py-1.5 font-mono text-xs font-semibold ${
              tab === "categories" ? "bg-panel-2 text-paper" : "text-muted hover:text-paper"
            }`}
          >
            {t("admin.catTitle")} · {categories.length}/{CATEGORY_LIMIT}
          </Link>
        </div>
        <p className="text-xs leading-relaxed text-muted">{t("admin.prodSourceNote")}</p>
      </div>

      {!botReady && <p className={`${badgeDanger} mt-5 px-3 py-2 text-sm`}>{t("admin.prodNoBot")}</p>}

      {message && <p className={`${badgeOk} mt-5 px-3 py-2 text-sm`}>{t(message)}</p>}
      {params.result === "failed" && (
        <p className={`${badgeDanger} mt-5 px-3 py-2 text-sm`}>
          {t("admin.deliveryFailed", { error: params.error ?? "" })}
        </p>
      )}

      {tab === "products" ? (
        <div className="mt-6 space-y-4">
          {botReady && (
            <details
              className={`${panel} p-5`}
              open={products.length === 0}
            >
              <summary className="cursor-pointer text-base font-semibold">{t("admin.prodAddTitle")}</summary>
              <p className="mt-2 text-xs leading-relaxed text-muted">{t("admin.prodAddHint")}</p>

              <form action={createProductAction} className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={label} htmlFor="new-label">
                      {t("admin.prodLabel")}
                    </label>
                    <input id="new-label" name="label" maxLength={80} required className={`${field} mt-2`} />
                  </div>
                  <div>
                    <label className={label} htmlFor="new-value">
                      {t("admin.prodValue")}
                    </label>
                    <input id="new-value" name="value" maxLength={50} className={`${field} mt-2 font-mono`} />
                    <p className="mt-1.5 text-xs text-muted">{t("admin.prodValueHint")}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <PriceInput t={t} id="new-price" value="" />
                  <CategorySelect t={t} id="new-category" categories={categories} selected={categories[0]?.id} />
                </div>

                <RoleSelect t={t} roles={roles} days={0} />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={label} htmlFor="new-promo">
                      {t("admin.promoLabel")}
                    </label>
                    <input
                      id="new-promo"
                      name="promoLabel"
                      maxLength={24}
                      placeholder={t("admin.promoPlaceholder")}
                      className={`${field} mt-2`}
                    />
                  </div>
                  <div className="flex flex-wrap items-end gap-6 pb-1">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="requiresKey" defaultChecked className="h-4 w-4" />
                      {t("admin.prodRequiresKey")}
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="featured" className="h-4 w-4" />
                      {t("admin.featured")}
                    </label>
                  </div>
                </div>

                <button type="submit" className={btnPrimary} disabled={products.length >= PRODUCT_LIMIT}>
                  {t("admin.prodCreate")}
                </button>
                {products.length >= PRODUCT_LIMIT && (
                  <p className="text-xs text-danger">{t("admin.prodLimit", { limit: PRODUCT_LIMIT })}</p>
                )}
              </form>
            </details>
          )}

          {products.length === 0 && <p className="text-sm text-muted">{t("admin.prodEmpty")}</p>}

          {products.map((product) => {
            const parsed = parsePrice(product.price);
            return (
              <article key={product.value} className={`${panel} p-5`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold">{product.label}</h2>
                      {product.promoLabel && <span className={badgePromo}>{product.promoLabel}</span>}
                      {product.featured && <span className={badgeMuted}>{t("admin.featured")}</span>}
                      {!product.autoRole && <span className={badgeDanger}>{t("admin.prodNoRoleBadge")}</span>}
                    </div>
                    <p className="mt-1.5 font-mono text-xs text-muted">
                      {product.value} · {product.price || "—"} · {product.categoryLabel} ·{" "}
                      {durationLabel(product.durationDays, locale)}
                    </p>
                    <p className="mt-1 font-mono text-xs text-muted">
                      {parsed.readable
                        ? t("admin.prodPriceReads", { amount: formatAmount(parsed.amount, settings.currencyLabel) })
                        : t("admin.prodPriceUnreadable")}
                      {product.roleId ? ` · ${t("admin.prodRole")}: ${product.roleId}` : ""}
                    </p>
                  </div>

                  <Link
                    href={`/products/${encodeURIComponent(product.value)}`}
                    className="font-mono text-xs text-accent transition hover:text-accent-dark"
                  >
                    {t("admin.prodViewInShop")}
                  </Link>
                </div>

                {botReady && (
                  <div className="mt-4 space-y-3 border-t border-line pt-4">
                    <details>
                      <summary className="cursor-pointer font-mono text-xs uppercase tracking-[0.14em] text-muted">
                        {t("admin.prodEdit")}
                      </summary>

                      <form action={updateProductAction} className="mt-4 space-y-4">
                        <input type="hidden" name="value" value={product.value} />

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className={label} htmlFor={`label-${product.value}`}>
                              {t("admin.prodLabel")}
                            </label>
                            <input
                              id={`label-${product.value}`}
                              name="label"
                              defaultValue={product.label}
                              maxLength={80}
                              required
                              className={`${field} mt-2`}
                            />
                          </div>
                          <PriceInput
                            t={t}
                            id={`price-${product.value}`}
                            value={product.price}
                            preview={pricePreview(product)}
                          />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <CategorySelect
                            t={t}
                            id={`category-${product.value}`}
                            categories={categories}
                            selected={product.category}
                          />
                          <div className="flex flex-wrap items-end gap-6 pb-1">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                name="requiresKey"
                                defaultChecked={product.requiresKey !== false}
                                className="h-4 w-4"
                              />
                              {t("admin.prodRequiresKey")}
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                name="featured"
                                defaultChecked={product.featured}
                                className="h-4 w-4"
                              />
                              {t("admin.featured")}
                            </label>
                          </div>
                        </div>

                        <RoleSelect
                          t={t}
                          roles={roles}
                          selected={product.roleId}
                          days={product.durationDays}
                        />

                        <div>
                          <label className={label} htmlFor={`promo-${product.value}`}>
                            {t("admin.promoLabel")}
                          </label>
                          <input
                            id={`promo-${product.value}`}
                            name="promoLabel"
                            defaultValue={product.promoLabel ?? ""}
                            maxLength={24}
                            placeholder={t("admin.promoPlaceholder")}
                            className={`${field} mt-2 sm:max-w-xs`}
                          />
                          <p className="mt-1.5 text-xs text-muted">{t("admin.promoHint")}</p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <button type="submit" className={btnPrimary}>
                            {t("admin.prodSave")}
                          </button>
                        </div>
                      </form>

                      <details className="mt-4">
                        <summary className="cursor-pointer font-mono text-xs text-danger">
                          {t("admin.prodDelete")}
                        </summary>
                        <form action={deleteProductAction} className="mt-3 flex flex-wrap items-center gap-3">
                          <input type="hidden" name="value" value={product.value} />
                          <p className="text-xs leading-relaxed text-muted">
                            {t("admin.prodDeleteHint", { label: product.label })}
                          </p>
                          <button type="submit" className={btnDanger}>
                            {t("admin.prodDeleteConfirm")}
                          </button>
                        </form>
                      </details>
                    </details>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {botReady && (
            <details className={`${panel} p-5`} open={categories.length === 0}>
              <summary className="cursor-pointer text-base font-semibold">{t("admin.catAddTitle")}</summary>
              <p className="mt-2 text-xs leading-relaxed text-muted">{t("admin.catAddHint")}</p>

              <form action={createCategoryAction} className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={label} htmlFor="new-cat-label">
                      {t("admin.prodLabel")}
                    </label>
                    <input id="new-cat-label" name="label" maxLength={80} required className={`${field} mt-2`} />
                  </div>
                  <div>
                    <label className={label} htmlFor="new-cat-id">
                      {t("admin.catId")}
                    </label>
                    <input id="new-cat-id" name="id" maxLength={30} className={`${field} mt-2 font-mono`} />
                    <p className="mt-1.5 text-xs text-muted">{t("admin.catIdHint")}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className={label} htmlFor="new-cat-emoji">
                      {t("admin.catEmoji")}
                    </label>
                    <input
                      id="new-cat-emoji"
                      name="emoji"
                      defaultValue="🎫"
                      maxLength={40}
                      className={`${field} mt-2`}
                    />
                  </div>
                  <StyleSelect t={t} id="new-cat-style" />
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="requiresKey" defaultChecked className="h-4 w-4" />
                      {t("admin.prodRequiresKey")}
                    </label>
                  </div>
                </div>

                <button type="submit" className={btnPrimary} disabled={categories.length >= CATEGORY_LIMIT}>
                  {t("admin.catCreate")}
                </button>
              </form>
            </details>
          )}

          {categories.length === 0 && <p className="text-sm text-muted">{t("admin.catEmpty")}</p>}

          {categories.map((category) => (
            <article key={category.id} className={`${panel} p-5`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">
                    {category.label}{" "}
                    <span className="font-mono text-xs text-muted">({category.id})</span>
                  </h2>
                  <p className="mt-1 font-mono text-xs text-muted">
                    {category.emoji ? `${category.emoji} · ` : ""}
                    {category.style ?? "Primary"} ·{" "}
                    {category.requiresKey === false ? t("admin.catNoKey") : t("admin.prodRequiresKey")}
                  </p>
                </div>
                {category.isDefault && <span className={badgeMuted}>{t("admin.catDefault")}</span>}
              </div>

              {botReady && (
                <div className="mt-4 space-y-3 border-t border-line pt-4">
                  <details>
                    <summary className="cursor-pointer font-mono text-xs uppercase tracking-[0.14em] text-muted">
                      {t("admin.prodEdit")}
                    </summary>

                    <form action={updateCategoryAction} className="mt-4 space-y-4">
                      <input type="hidden" name="id" value={category.id} />

                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className={label} htmlFor={`cat-label-${category.id}`}>
                            {t("admin.prodLabel")}
                          </label>
                          <input
                            id={`cat-label-${category.id}`}
                            name="label"
                            defaultValue={category.label}
                            maxLength={80}
                            required
                            className={`${field} mt-2`}
                          />
                        </div>
                        <div>
                          <label className={label} htmlFor={`cat-emoji-${category.id}`}>
                            {t("admin.catEmoji")}
                          </label>
                          <input
                            id={`cat-emoji-${category.id}`}
                            name="emoji"
                            defaultValue={category.emoji ?? ""}
                            maxLength={40}
                            className={`${field} mt-2`}
                          />
                        </div>
                        <StyleSelect t={t} id={`cat-style-${category.id}`} selected={category.style} />
                      </div>

                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          name="requiresKey"
                          defaultChecked={category.requiresKey !== false}
                          className="h-4 w-4"
                        />
                        {t("admin.prodRequiresKey")}
                      </label>

                      <button type="submit" className={btnPrimary}>
                        {t("admin.prodSave")}
                      </button>
                    </form>

                    {!category.isDefault && (
                      <details className="mt-4">
                        <summary className="cursor-pointer font-mono text-xs text-danger">
                          {t("admin.catDelete")}
                        </summary>
                        <form action={deleteCategoryAction} className="mt-3 flex flex-wrap items-center gap-3">
                          <input type="hidden" name="id" value={category.id} />
                          <p className="text-xs leading-relaxed text-muted">
                            {t("admin.catDeleteHint", { label: category.label })}
                          </p>
                          <button type="submit" className={btnDanger}>
                            {t("admin.prodDeleteConfirm")}
                          </button>
                        </form>
                      </details>
                    )}
                  </details>
                </div>
              )}
            </article>
          ))}

          <p className="text-xs leading-relaxed text-muted">{t("admin.catDefaultNote")}</p>
        </div>
      )}
    </div>
  );
}
