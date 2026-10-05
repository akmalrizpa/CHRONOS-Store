import { getLocale } from "@/lib/locale";
import { createTranslator } from "@/i18n/dictionary";
import { getSettings } from "@/lib/store";
import { btnOutline, pageTop, panel, sectionLead, sectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

type FaqItem = { q: string; a: string };

export default async function FaqPage() {
  const locale = await getLocale();
  const { t, tu } = createTranslator(locale);
  const [settings, items] = await Promise.all([getSettings(), Promise.resolve(tu<FaqItem[]>("faq.items"))]);

  return (
    <div className={pageTop}>
      <h1 className={sectionTitle}>{t("faq.title")}</h1>
      <p className={sectionLead}>{t("faq.lead")}</p>

      <div className="mt-10 grid gap-x-12 gap-y-8 sm:grid-cols-2">
        {items.map((item) => (
          <article key={item.q} className="border-t border-line pt-5">
            <h2 className="text-base font-semibold">{item.q}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
          </article>
        ))}
      </div>

      <div className={`${panel} mt-12 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between`}>
        <div>
          <p className="text-sm font-semibold">{t("footer.support")}</p>
          <p className="mt-1 font-mono text-sm text-muted">{settings.supportHours || "—"}</p>
        </div>
        {settings.discordInviteUrl && (
          <a href={settings.discordInviteUrl} target="_blank" rel="noreferrer" className={btnOutline}>
            {t("home.ctaDiscord")}
          </a>
        )}
      </div>
    </div>
  );
}
