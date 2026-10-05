"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { logoutAction } from "@/app/actions/session";
import LanguageSwitcher from "./LanguageSwitcher";
import type { Locale } from "@/lib/locale";
import { btnPrimary } from "./ui";

export type NavLink = { href: string; label: string };

type Props = {
  links: NavLink[];
  locale: Locale;
  user: { name: string; isStaff: boolean } | null;
  labels: { orders: string; admin: string; login: string; logout: string; open: string; close: string };
};

export default function MobileMenu({ links, locale, user, labels }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="lg:hidden">
      <div className="flex items-center gap-2">
        <LanguageSwitcher locale={locale} />
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="rounded-card border border-line px-3 py-1.5 font-mono text-xs font-semibold text-paper"
        >
          {open ? labels.close : labels.open}
        </button>
      </div>

      {open && (
        <div className="absolute inset-x-0 top-16 z-40 border-b border-line bg-panel px-5 py-3">
          <nav className="flex flex-col">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-card px-2 py-2.5 text-sm font-semibold text-muted"
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link href="/orders" className="rounded-card px-2 py-2.5 text-sm font-semibold text-muted">
                  {labels.orders}
                </Link>
                {user.isStaff && (
                  <Link href="/admin" className="rounded-card px-2 py-2.5 text-sm font-semibold text-muted">
                    {labels.admin}
                  </Link>
                )}
                <form action={logoutAction} className="mt-1">
                  <button type="submit" className="rounded-card px-2 py-2.5 text-sm font-semibold text-muted">
                    {labels.logout}
                  </button>
                </form>
              </>
            ) : (
              <Link href="/login" className={`${btnPrimary} mt-2 justify-center`} onClick={() => setOpen(false)}>
                {labels.login}
              </Link>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
