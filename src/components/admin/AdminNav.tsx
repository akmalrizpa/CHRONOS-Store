"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type AdminNavItem = { href: string; label: string; badge?: number };

export default function AdminNav({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="-mx-5 flex gap-2 overflow-x-auto border-b border-line px-5 pb-3 sm:mx-0 sm:px-0">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex shrink-0 items-center gap-2 rounded-card px-3 py-2 text-sm font-semibold transition ${
              active ? "bg-accent text-ink" : "border border-line text-muted hover:text-paper"
            }`}
          >
            {item.label}
            {item.badge !== undefined && item.badge > 0 && (
              <span
                className={`rounded-card px-1.5 py-0.5 font-mono text-xs ${
                  active ? "bg-ink/15 text-ink" : "bg-panel-2 text-accent"
                }`}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
