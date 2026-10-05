import { saveSettingsAction } from "@/app/actions/admin";
import { getLocale } from "@/lib/locale";
import { createTranslator } from "@/i18n/dictionary";
import { getSettings } from "@/lib/store";
import { badgeOk, btnPrimary, field, label, panel } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const params = await searchParams;
  const locale = await getLocale();
  const { t } = createTranslator(locale);
  const settings = await getSettings();

  const textFields: { name: keyof typeof settings; label: string; hint?: string }[] = [
    { name: "qrisImageUrl", label: t("admin.qrisImageUrl"), hint: t("admin.qrisHint") },
    { name: "paymentNote", label: t("admin.paymentNote"), hint: t("admin.paymentNoteHint") },
    { name: "promoBanner", label: t("admin.promoBanner"), hint: t("admin.promoBannerHint") },
    { name: "supportHours", label: t("admin.supportHours") },
    { name: "discordInviteUrl", label: t("admin.discordInviteUrl") },
    { name: "whatsappUrl", label: t("admin.whatsappUrl") },
    { name: "telegramUrl", label: t("admin.telegramUrl") },
    { name: "currencyLabel", label: t("admin.currencyLabel"), hint: t("admin.currencyHint") },
  ];

  return (
    <form action={saveSettingsAction} className="max-w-3xl space-y-6">
      <div className={`${panel} p-6`}>
        <h2 className="text-base font-semibold">{t("admin.settingsTitle")}</h2>
        <p className="mt-2 text-xs leading-relaxed text-muted">{t("admin.settingsLead")}</p>

        {params.saved === "1" && <p className={`${badgeOk} mt-4 px-3 py-2 text-sm`}>{t("admin.saved")}</p>}

        <div className="mt-6 space-y-6">
          {textFields.map((item) => (
            <div key={item.name}>
              <label className={label} htmlFor={item.name}>
                {item.label}
              </label>
              <input
                id={item.name}
                name={item.name}
                defaultValue={String(settings[item.name] ?? "")}
                maxLength={500}
                className={`${field} mt-2`}
              />
              {item.hint && <p className="mt-1.5 text-xs text-muted">{item.hint}</p>}
            </div>
          ))}

          <label className="flex items-start gap-3 border-t border-line pt-5 text-sm">
            <input type="checkbox" name="storeOpen" defaultChecked={settings.storeOpen} className="mt-0.5 h-4 w-4" />
            <span>
              {t("admin.storeOpen")}
              <span className="mt-1 block text-xs text-muted">{t("admin.storeOpenHint")}</span>
            </span>
          </label>
        </div>
      </div>

      <button type="submit" className={btnPrimary}>
        {t("admin.saveSettings")}
      </button>
    </form>
  );
}
