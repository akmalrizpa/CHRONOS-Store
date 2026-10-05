import Link from "next/link";
import type { CatalogProduct } from "@/lib/types";
import type { Locale } from "@/lib/locale";
import type { Translator } from "@/i18n/dictionary";
import { durationLabel } from "@/lib/price";
import { badgeMuted, badgePromo, panel } from "./ui";

export default function ProductCard({
  product,
  t,
  locale,
}: {
  product: CatalogProduct;
  t: Translator["t"];
  locale: Locale;
}) {
  return (
    <article className={`${panel} flex flex-col p-4 transition hover:border-muted/60`}>
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted">{product.categoryLabel}</p>
        {product.promoLabel && <span className={badgePromo}>{product.promoLabel}</span>}
      </div>

      <h3 className="mt-3 text-base font-semibold leading-snug">
        <Link href={`/products/${encodeURIComponent(product.value)}`} className="transition hover:text-accent">
          {product.label}
        </Link>
      </h3>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={badgeMuted}>{durationLabel(product.durationDays, locale)}</span>
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 pt-5">
        <p className="font-mono text-lg font-semibold">{product.price || "—"}</p>
        <Link
          href={`/checkout/${encodeURIComponent(product.value)}`}
          className="rounded-card bg-accent px-3 py-2 text-xs font-semibold text-ink transition hover:bg-accent-dark"
        >
          {t("shop.buy")}
        </Link>
      </div>
    </article>
  );
}
