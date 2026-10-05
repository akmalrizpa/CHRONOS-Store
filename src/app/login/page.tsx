import Link from "next/link";
import { demoMode, getSession, isAuthConfigured } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { createTranslator } from "@/i18n/dictionary";
import { btnOutline, btnPrimary, pageTop, panel, sectionLead, sectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const locale = await getLocale();
  const { t } = createTranslator(locale);
  const user = await getSession();

  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/orders";

  return (
    <div className={pageTop}>
      <h1 className={sectionTitle}>{t("login.title")}</h1>
      <p className={sectionLead}>{t("login.lead")}</p>

      <div className={`${panel} mt-8 max-w-xl p-6`}>
        {user ? (
          <>
            <div className="flex items-center gap-3">
              {user.avatarUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt="" className="h-10 w-10 rounded-full" />
              )}
              <div>
                <p className="text-sm font-semibold">{t("login.signedInAs", { name: user.displayName })}</p>
                <p className="font-mono text-xs text-muted">{user.username}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/orders" className={btnPrimary}>
                {t("login.goOrders")}
              </Link>
              <Link href="/shop" className={btnOutline}>
                {t("login.goShopping")}
              </Link>
            </div>
          </>
        ) : (
          <>
            {demoMode() ? (
              <div>
                <p className="text-sm font-semibold">{t("demo.title")}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted">{t("demo.body")}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a href="/api/auth/demo?role=staff&next=/admin" className={btnPrimary}>
                    {t("demo.staff")}
                  </a>
                  <a href="/api/auth/demo?role=customer&next=/shop" className={btnOutline}>
                    {t("demo.customer")}
                  </a>
                </div>
              </div>
            ) : null}

            {isAuthConfigured ? (
              <a
                href={`/api/auth/login?next=${encodeURIComponent(safeNext)}`}
                className={`${btnPrimary} ${demoMode() ? "mt-6 border-t border-line pt-6" : ""} w-full sm:w-auto`}
              >
                {t("login.cta")}
              </a>
            ) : (
              <p className={`text-sm leading-relaxed text-muted ${demoMode() ? "mt-6 border-t border-line pt-5" : ""}`}>
                {t("login.notConfigured")}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
