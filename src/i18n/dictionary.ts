import en from "@/locales/en.json";
import id from "@/locales/id.json";
import type { Locale } from "@/lib/locale";

const DICTS: Record<Locale, unknown> = { en, id };

function read(dict: unknown, key: string): unknown {
  return key
    .split(".")
    .reduce<unknown>(
      (node, part) => (node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined),
      dict,
    );
}

function interpolate(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
}

/** Resolves locale → English → the key itself, same order the bot uses. */
export function translate(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  const hit = read(DICTS[locale], key) ?? read(DICTS.en, key);
  return typeof hit === "string" ? interpolate(hit, vars) : key;
}

/** Raw value for lists and objects (FAQs, steps, features). */
export function translateRaw<T>(locale: Locale, key: string): T {
  return (read(DICTS[locale], key) ?? read(DICTS.en, key)) as T;
}

export function createTranslator(locale: Locale) {
  return {
    locale,
    t: (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
    tu: <T,>(key: string) => translateRaw<T>(locale, key),
  };
}

export type Translator = ReturnType<typeof createTranslator>;
