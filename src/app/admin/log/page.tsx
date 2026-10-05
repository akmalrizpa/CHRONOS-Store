import Link from "next/link";
import { getLocale } from "@/lib/locale";
import { createTranslator } from "@/i18n/dictionary";
import { listActivity } from "@/lib/store";
import { badgeMuted, panel } from "@/components/ui";

export const dynamic = "force-dynamic";

const GROUPS = ["order", "product", "category", "customer", "settings", "review", "login"] as const;

export default async function AdminLogPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const params = await searchParams;
  const locale = await getLocale();
  const { t } = createTranslator(locale);

  const group = (GROUPS as readonly string[]).includes(params.group ?? "") ? params.group : undefined;
  const all = await listActivity({ limit: 300 });
  const entries = group ? all.filter((entry) => entry.action.startsWith(group)) : all;

  const dateFormat = (iso: string) =>
    new Date(iso).toLocaleString(locale === "id" ? "id-ID" : "en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">{t("admin.logTitle")}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{t("admin.logLead")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/admin/log"
          className={`rounded-card px-3 py-1.5 font-mono text-xs font-semibold ${
            !group ? "bg-panel-2 text-paper" : "text-muted hover:text-paper"
          }`}
        >
          {t("admin.filterAll")} · {all.length}
        </Link>
        {GROUPS.map((item) => {
          const count = all.filter((entry) => entry.action.startsWith(item)).length;
          return (
            <Link
              key={item}
              href={`/admin/log?group=${item}`}
              className={`rounded-card px-3 py-1.5 font-mono text-xs font-semibold ${
                group === item ? "bg-panel-2 text-paper" : "text-muted hover:text-paper"
              }`}
            >
              {item} · {count}
            </Link>
          );
        })}
      </div>

      {entries.length === 0 ? (
        <p className="rounded-card border border-dashed border-line px-4 py-12 text-center text-sm text-muted">
          {t("admin.logEmpty")}
        </p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {entries.map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3">
              <span className="w-32 shrink-0 font-mono text-xs text-muted">{dateFormat(entry.at)}</span>
              <span className={badgeMuted}>{entry.action}</span>
              <span className="min-w-0 flex-1 text-sm">
                <span className="font-mono text-xs text-muted">{entry.target || "—"}</span>
                {entry.detail && <span className="text-muted"> · {entry.detail}</span>}
              </span>
              <span className="font-mono text-xs text-muted">{entry.actorName || entry.actorId}</span>
            </li>
          ))}
        </ul>
      )}

      <p className={`${panel} p-4 text-xs leading-relaxed text-muted`}>{t("admin.logNote")}</p>
    </div>
  );
}
