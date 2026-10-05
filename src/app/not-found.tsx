import Link from "next/link";
import { getLocale } from "@/lib/locale";
import { createTranslator } from "@/i18n/dictionary";
import { btnOutline, btnPrimary, pageTop, sectionTitle } from "@/components/ui";

export default async function NotFound() {
  const locale = await getLocale();
  const { t } = createTranslator(locale);

  return (
    <div className={pageTop}>
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">404</p>
      <h1 className={`${sectionTitle} mt-3`}>{t("common.notFoundTitle")}</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{t("common.notFoundBody")}</p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Link href="/shop" className={btnPrimary}>
          {t("nav.shop")}
        </Link>
        <Link href="/" className={btnOutline}>
          {t("common.backHome")}
        </Link>
      </div>
    </div>
  );
}
