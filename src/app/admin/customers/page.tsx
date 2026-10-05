import { setCustomerRoleAction } from "@/app/actions/admin";
import { getStaffSession, staffIds } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { createTranslator } from "@/i18n/dictionary";
import { getSettings, hasDatabase, listCustomers, listOrders } from "@/lib/store";
import { formatAmount } from "@/lib/price";
import { badgeDanger, badgeMuted, badgeOk, btnDanger, btnSoft, panel } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string }>;
}) {
  const params = await searchParams;
  const locale = await getLocale();
  const { t } = createTranslator(locale);

  const [customers, orders, settings] = await Promise.all([
    listCustomers(),
    listOrders({ limit: 200 }),
    getSettings(),
  ]);
  const me = await getStaffSession();

  const stats = new Map<string, { count: number; spent: number }>();
  for (const order of orders) {
    const current = stats.get(order.buyerDiscordId) ?? { count: 0, spent: 0 };
    current.count += 1;
    if (order.status === "delivered" && Number.isFinite(order.priceAmount)) current.spent += order.priceAmount;
    stats.set(order.buyerDiscordId, current);
  }

  const envStaff = staffIds();

  return (
    <div className="space-y-6">
      {params.result === "self" && <p className={`${badgeDanger} px-3 py-2 text-sm`}>{t("admin.custSelf")}</p>}
      {params.result === "demo" && <p className={`${badgeDanger} px-3 py-2 text-sm`}>{t("demo.readOnly")}</p>}
      {params.result === "role" && <p className={`${badgeOk} px-3 py-2 text-sm`}>{t("admin.saved")}</p>}

      {!hasDatabase && <p className={`${badgeDanger} px-3 py-2 text-sm`}>{t("admin.custNoDb")}</p>}

      <p className="text-xs leading-relaxed text-muted">{t("admin.custLead")}</p>

      {customers.length === 0 ? (
        <p className="rounded-card border border-dashed border-line px-4 py-12 text-center text-sm text-muted">
          {t("admin.custEmpty")}
        </p>
      ) : (
        <ul className="space-y-3">
          {customers.map((customer) => {
            const customerStats = stats.get(customer.discordId) ?? { count: 0, spent: 0 };
            const isEnv = envStaff.includes(customer.discordId);

            return (
              <li key={customer.discordId} className={`${panel} flex flex-wrap items-center gap-4 p-4`}>
                {customer.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={customer.avatarUrl} alt="" className="h-10 w-10 rounded-full" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-panel-2 font-mono text-sm">
                    {customer.displayName.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{customer.displayName}</p>
                    {customer.role === "admin" ? (
                      <span className={badgeOk}>{t("admin.custAdmin")}</span>
                    ) : (
                      <span className={badgeMuted}>{t("admin.custCustomer")}</span>
                    )}
                    {isEnv && <span className={badgeMuted}>{t("admin.custEnvStaff")}</span>}
                    {me?.id === customer.discordId && <span className={badgeMuted}>{t("admin.custYou")}</span>}
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted">
                    {customer.username} · {customer.discordId}
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted">
                    {t("admin.custOrders", { count: customerStats.count })} ·{" "}
                    {formatAmount(customerStats.spent, settings.currencyLabel)} ·{" "}
                    {t("admin.custLastSeen", {
                      date: new Date(customer.lastSeen).toLocaleDateString(locale === "id" ? "id-ID" : "en-GB"),
                    })}
                  </p>
                </div>

                <form action={setCustomerRoleAction} className="flex items-center gap-2">
                  <input type="hidden" name="discordId" value={customer.discordId} />
                  <input
                    type="hidden"
                    name="role"
                    value={customer.role === "admin" ? "customer" : "admin"}
                  />
                  <button type="submit" className={customer.role === "admin" ? btnDanger : btnSoft}>
                    {customer.role === "admin" ? t("admin.custDemote") : t("admin.custPromote")}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}

      {envStaff.length > 0 && (
        <div className={`${panel} p-5`}>
          <h2 className="text-base font-semibold">{t("admin.custEnvTitle")}</h2>
          <p className="mt-2 text-xs leading-relaxed text-muted">{t("admin.custEnvBody")}</p>
          <p className="mt-2 font-mono text-xs text-muted">{envStaff.join(" · ")}</p>
        </div>
      )}
    </div>
  );
}
