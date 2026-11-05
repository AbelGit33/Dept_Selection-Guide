/**
 * Locale registry for the Dept Selection Guide.
 *
 * Locales are URL-addressable (`/en/...`, `/am/...`) rather than a client-side
 * toggle, so a given page has exactly one canonical URL, `<html lang>` is
 * correct on first paint, and screen readers / crawlers see the right language.
 *
 * Adding a locale is: append the code to LOCALES, add a LocaleMeta entry, and
 * add a dictionary file that satisfies `Dictionary`. No other file changes.
 */

export const LOCALES = ["en", "am"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export interface LocaleMeta {
  code: Locale;
  /** Endonym — the language named in itself, which is what a switcher should show. */
  label: string;
  /** BCP-47 tag handed to Intl for number, currency and date formatting. */
  intl: string;
  dir: "ltr" | "rtl";
}

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  en: { code: "en", label: "English", intl: "en-US", dir: "ltr" },
  am: { code: "am", label: "አማርኛ", intl: "am-ET", dir: "ltr" },
};

/** Persisted so a returning visitor keeps their language despite browser prefs. */
export const LOCALE_COOKIE = "dsg-locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

export function getIntlLocale(locale: Locale): string {
  return LOCALE_META[locale].intl;
}

/** Prefix a path with its locale, tolerating leading/trailing slashes. */
export function localePath(locale: Locale, path = ""): string {
  const clean = path.replace(/^\/+/, "").replace(/\/+$/, "");
  return clean ? `/${locale}/${clean}` : `/${locale}`;
}

/**
 * Swap the locale segment of a pathname, preserving query and hash.
 * Used by the switcher so the reader lands on the same page, translated.
 */
export function swapLocaleInPath(pathname: string, next: Locale): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length > 0 && isLocale(parts[0])) parts[0] = next;
  else parts.unshift(next);
  return `/${parts.join("/")}`;
}

/**
 * Best-effort match of an Accept-Language header to a supported locale.
 * Matches primary subtag only ("am-ET" -> "am"), which is enough for this app
 * and avoids pulling in a full negotiator.
 */
export function negotiateLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q.slice(2)) || 0 : 1 };
    })
    .filter((r) => r.tag)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    if (isLocale(tag)) return tag;
    const primary = tag.split("-")[0];
    if (isLocale(primary)) return primary;
  }
  return DEFAULT_LOCALE;
}