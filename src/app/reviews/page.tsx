import Link from "next/link";
import { getLocale } from "@/lib/locale";
import { createTranslator } from "@/i18n/dictionary";
import { listReviews } from "@/lib/store";
import { btnPrimary, pageTop, panel, sectionLead, sectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const locale = await getLocale();
  const { t } = createTranslator(locale);
  const reviews = await listReviews(30);

  const average = reviews.length
    ? (reviews.reduce((total, review) => total + review.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className={pageTop}>
      <h1 className={sectionTitle}>{t("reviews.title")}</h1>
      <p className={sectionLead}>{t("reviews.lead")}</p>

      {average && (
        <p className="mt-4 font-mono text-sm text-muted">
          {t("reviews.stars", { rating: average })} · {reviews.length}
        </p>
      )}

      {reviews.length === 0 ? (
        <div className={`${panel} mt-8 px-5 py-12 text-center`}>
          <p className="text-sm text-muted">{t("reviews.empty")}</p>
          <Link href="/shop" className={`${btnPrimary} mt-5`}>
            {t("orders.browse")}
          </Link>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {reviews.map((review) => (
            <li key={review.id} className={`${panel} p-5`}>
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-xs text-accent">{t("reviews.stars", { rating: review.rating })}</p>
                <p className="font-mono text-xs text-muted">
                  {new Date(review.createdAt).toLocaleDateString(locale === "id" ? "id-ID" : "en-GB")}
                </p>
              </div>
              {review.body && <p className="mt-3 text-sm leading-relaxed text-muted">{review.body}</p>}
              <p className="mt-4 border-t border-line pt-3 font-mono text-xs text-muted">
                {t("reviews.from", { name: review.buyerUsername })} · {review.productLabel}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
