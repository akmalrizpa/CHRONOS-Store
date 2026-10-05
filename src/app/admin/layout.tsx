import { getStaffSession, isAuthConfigured } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { createTranslator } from "@/i18n/dictionary";
import { countOrders } from "@/lib/store";
import AdminNav from "@/components/admin/AdminNav";
import { btnPrimary, pageTop, sectionLead, sectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const { t } = createTranslator(locale);
  const staff = await getStaffSession();

  if (!staff) {
    return (
      <div className={pageTop}>
        <h1 className={sectionTitle}>{t("admin.title")}</h1>
        <p className={sectionLead}>{isAuthConfigured ? t("admin.notStaff") : t("login.notConfigured")}</p>
        {isAuthConfigured && (
          <a href={`/login?next=${encodeURIComponent("/admin")}`} className={`${btnPrimary} mt-6`}>
            {t("checkout.loginCta")}
          </a>
        )}
      </div>
    );
  }

  const pending = await countOrders("review");

  return (
    <div className={pageTop}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={sectionTitle}>{t("admin.title")}</h1>
          <p className={sectionLead}>{t("admin.lead")}</p>
        </div>
        <p className="font-mono text-xs text-muted">{t("admin.signedInAs", { name: staff.displayName })}</p>
      </div>

      {staff.demo && (
        <p className="mt-5 rounded-card border border-accent/40 bg-accent-soft px-4 py-3 text-xs leading-relaxed text-accent sm:text-sm">
          {t("demo.staffBanner")}
        </p>
      )}

      <div className="mt-8">
        <AdminNav
          items={[
            { href: "/admin", label: t("admin.navDashboard") },
            { href: "/admin/orders", label: t("admin.navOrders"), badge: pending },
            { href: "/admin/products", label: t("admin.navProducts") },
            { href: "/admin/stats", label: t("admin.navStats") },
            { href: "/admin/log", label: t("admin.navLog") },
            { href: "/admin/customers", label: t("admin.navCustomers") },
            { href: "/admin/settings", label: t("admin.navSettings") },
          ]}
        />
      </div>

      <div className="mt-8">{children}</div>
    </div>
  );
}
