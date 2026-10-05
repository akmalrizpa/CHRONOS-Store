import Link from "next/link";
import { getSession, isStaffUser } from "@/lib/auth";
import { createTranslator } from "@/i18n/dictionary";
import type { Locale } from "@/lib/locale";
import { logoutAction } from "@/app/actions/session";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileMenu from "./MobileMenu";
import { btnPrimary, pageShell } from "./ui";

const STORE_NAME = process.env.STORE_NAME || "CHRONOS Store";

export default async function Header({ locale }: { locale: Locale }) {
  const { t } = createTranslator(locale);
  const user = await getSession();
  const staff = Boolean(user && (await isStaffUser(user.id)));

  const links = [
    { href: "/", label: t("nav.home") },
    { href: "/shop", label: t("nav.shop") },
    { href: "/reviews", label: t("nav.reviews") },
    { href: "/status", label: t("nav.status") },
    { href: "/faq", label: t("nav.faq") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink">
      <div className={`${pageShell} relative flex h-16 items-center justify-between gap-3`}>
        <Link href="/" className="flex items-center gap-2.5">
          <svg viewBox="0 0 32 32" aria-hidden="true" className="h-7 w-7 text-accent">
            <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <path d="M16 8.5V16l5.5 3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span className="font-mono text-base font-semibold tracking-tight">{STORE_NAME}</span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-semibold text-muted transition hover:text-paper">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher locale={locale} />
          {user ? (
            <>
              <Link href="/orders" className="text-sm font-semibold text-muted transition hover:text-paper">
                {t("nav.orders")}
              </Link>
              <Link href="/account" className="text-sm font-semibold text-muted transition hover:text-paper">
                {t("nav.account")}
              </Link>
              {staff && (
                <Link href="/admin" className="text-sm font-semibold text-accent transition hover:text-accent-dark">
                  {t("nav.admin")}
                </Link>
              )}
              <span className="flex items-center gap-2 text-sm text-muted">
                {user.avatarUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt="" className="h-7 w-7 rounded-full" />
                )}
                {user.displayName}
              </span>
              <form action={logoutAction}>
                <button type="submit" className="text-sm font-semibold text-muted transition hover:text-paper">
                  {t("nav.logout")}
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className={btnPrimary}>
              {t("nav.login")}
            </Link>
          )}
        </div>

        <MobileMenu
          links={links}
          locale={locale}
          user={user ? { name: user.displayName, isStaff: staff } : null}
          labels={{
            orders: t("nav.orders"),
            account: t("nav.account"),
            admin: t("nav.admin"),
            login: t("nav.login"),
            logout: t("nav.logout"),
            open: t("nav.openMenu"),
            close: t("nav.closeMenu"),
          }}
        />
      </div>
    </header>
  );
}
