import Link from "next/link";
import { createTranslator } from "@/i18n/dictionary";
import { getSettings } from "@/lib/store";
import type { Locale } from "@/lib/locale";
import { PAYMENT_METHODS } from "@/data/shop";
import { getBotHealth } from "@/lib/catalog";
import { pageShell } from "./ui";

const STORE_NAME = process.env.STORE_NAME || "CHRONOS Store";

export default async function Footer({ locale }: { locale: Locale }) {
  const { t } = createTranslator(locale);
  const [settings, health] = await Promise.all([getSettings(), getBotHealth()]);

  const community = [
    settings.discordInviteUrl ? { href: settings.discordInviteUrl, label: "Discord" } : null,
    settings.whatsappUrl ? { href: settings.whatsappUrl, label: "WhatsApp" } : null,
    settings.telegramUrl ? { href: settings.telegramUrl, label: "Telegram" } : null,
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <footer className="mt-16 border-t border-line bg-panel">
      <div className={`${pageShell} grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4`}>
        <div className="lg:col-span-2">
          <p className="font-mono text-sm font-semibold">{STORE_NAME}</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">{t("footer.note")}</p>
          <p className="mt-3 font-mono text-xs text-muted">
            {health ? t("common.botOnline", { version: health.version }) : t("common.botOffline")}
          </p>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">{t("footer.shopLinks")}</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/shop" className="text-muted transition hover:text-paper">
                {t("nav.shop")}
              </Link>
            </li>
            <li>
              <Link href="/reviews" className="text-muted transition hover:text-paper">
                {t("nav.reviews")}
              </Link>
            </li>
            <li>
              <Link href="/status" className="text-muted transition hover:text-paper">
                {t("nav.status")}
              </Link>
            </li>
            <li>
              <Link href="/faq" className="text-muted transition hover:text-paper">
                {t("nav.faq")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">{t("footer.community")}</p>
          <ul className="mt-3 space-y-2 text-sm">
            {community.map((item) => (
              <li key={item.href}>
                <a href={item.href} target="_blank" rel="noreferrer" className="text-muted transition hover:text-paper">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <p className="mt-6 font-mono text-xs uppercase tracking-[0.18em] text-muted">{t("footer.support")}</p>
          <p className="mt-2 font-mono text-sm text-muted">{settings.supportHours || "—"}</p>

          <p className="mt-6 font-mono text-xs uppercase tracking-[0.18em] text-muted">{t("footer.payments")}</p>
          <p className="mt-2 text-sm text-muted">{PAYMENT_METHODS.join(" · ")}</p>
        </div>
      </div>

      <div className={`${pageShell} border-t border-line py-5`}>
        <p className="font-mono text-xs text-muted">
          © {new Date().getFullYear()} {STORE_NAME}
        </p>
      </div>
    </footer>
  );
}
