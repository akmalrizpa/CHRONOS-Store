"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocaleAction } from "@/app/actions/session";
import type { Locale } from "@/lib/locale";

const OPTIONS: { code: Locale; short: string; label: string }[] = [
  { code: "en", short: "EN", label: "English" },
  { code: "id", short: "ID", label: "Bahasa Indonesia" },
];

export default function LanguageSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const switchTo = (code: Locale) => {
    if (code === locale) return;
    startTransition(async () => {
      await setLocaleAction(code);
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-0.5 rounded-card border border-line bg-panel p-0.5" role="group" aria-label="Language">
      {OPTIONS.map((option) => (
        <button
          key={option.code}
          type="button"
          onClick={() => switchTo(option.code)}
          disabled={pending}
          aria-pressed={locale === option.code}
          title={option.label}
          className={`rounded-card px-2 py-1 font-mono text-xs font-semibold transition ${
            locale === option.code ? "bg-accent text-ink" : "text-muted hover:text-paper"
          }`}
        >
          {option.short}
        </button>
      ))}
    </div>
  );
}
