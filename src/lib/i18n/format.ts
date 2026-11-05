/**
 * Locale-aware formatters.
 *
 * These are drop-in replacements for the `en-US` helpers in `@/lib/utils`, which
 * stay in place for the few server-side call sites that are English-only by
 * definition (BLS series notes, raw series ids).
 *
 * Two deliberate choices:
 *
 * 1. Currency stays USD. The underlying figures are US BLS OEWS wages, so
 *    switching to a local currency would misrepresent the source. What changes
 *    is the *rendering*: `am-ET` correctly yields "US$85,000", which is more
 *    honest than "$85,000" for an Ethiopian reader.
 * 2. Compact currency uses an explicit k/M suffix rather than
 *    `notation: "compact"`, because compact notation in `am-ET` swaps the Latin
 *    digits for Ethiopic magnitude glyphs (ሺ, ሚ) and produces mixed-script chips
 *    like "US$85 ሺ" that read badly next to the Latin numerals used elsewhere.
 */

import { getIntlLocale, type Locale } from "./config";

export interface Formatters {
  intl: string;
  usd: (n: number, opts?: { compact?: boolean }) => string;
  number: (n: number, digits?: number) => string;
  compactNumber: (n: number) => string;
  pct: (n: number, digits?: number) => string;
  signedPct: (n: number, digits?: number) => string;
  gpa: (n: number) => string;
  date: (iso: string) => string;
  relative: (iso: string) => string;
  /** Bare integer with grouping — for counts like "20 departments". */
  count: (n: number) => string;
  /** En-dash range, e.g. "$70,000–$95,000". */
  range: (from: number, to: number) => string;
}

export interface FormatterFallbacks {
  unknown: string;
  emDash: string;
}

const cache = new Map<string, Formatters>();

function trim(n: number): string {
  return n >= 100 ? Math.round(n).toString() : n.toFixed(1).replace(/\.0$/, "");
}

export function createFormatters(locale: Locale, fallback: FormatterFallbacks = { unknown: "unknown", emDash: "—" }): Formatters {
  const intl = getIntlLocale(locale);
  const cached = cache.get(intl);
  if (cached) return cached;

  const nf = new Intl.NumberFormat(intl, { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat(intl, { maximumFractionDigits: 1 });
  const currency = new Intl.NumberFormat(intl, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const dateFmt = new Intl.DateTimeFormat(intl, { year: "numeric", month: "long", day: "numeric" });
  const rtf = new Intl.RelativeTimeFormat(intl, { numeric: "auto" });

  // Pull just the currency glyph ("$" / "US$") so compact mode can append an
  // ASCII k/M suffix without importing Ethiopic compact glyphs.
  const symbol =
    currency
      .formatToParts(1)
      .find((p) => p.type === "currency")
      ?.value.trim() || "$";

  const full = (n: number): string => currency.format(n);

  const out: Formatters = {
    intl,

    usd(n, opts) {
      if (!Number.isFinite(n)) return fallback.emDash;
      if (opts?.compact && Math.abs(n) >= 1000) {
        if (Math.abs(n) >= 1_000_000) return `${symbol}${trim(n / 1_000_000)}M`;
        return `${symbol}${trim(n / 1000)}k`;
      }
      return full(n);
    },

    number(n, digits = 0) {
      if (!Number.isFinite(n)) return fallback.emDash;
      return digits > 0 ? new Intl.NumberFormat(intl, { maximumFractionDigits: digits }).format(n) : nf.format(n);
    },

    compactNumber(n) {
      if (!Number.isFinite(n)) return fallback.emDash;
      const abs = Math.abs(n);
      if (abs >= 1_000_000) return `${nf1.format(n / 1_000_000)}M`;
      if (abs >= 1_000) return `${nf1.format(n / 1_000)}k`;
      return nf.format(n);
    },

    pct(n, digits = 0) {
      if (!Number.isFinite(n)) return fallback.emDash;
      return `${new Intl.NumberFormat(intl, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n * 100)}%`;
    },

    signedPct(n, digits = 1) {
      if (!Number.isFinite(n)) return fallback.emDash;
      const v = Number(n.toFixed(digits));
      const body = new Intl.NumberFormat(intl, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Math.abs(v));
      return `${v >= 0 ? "+" : "−"}${body}%`;
    },

    gpa(n) {
      return Number.isFinite(n) ? nf1.format(Number(n.toFixed(2))) : fallback.emDash;
    },

    date(iso) {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return fallback.emDash;
      return dateFmt.format(d);
    },

    relative(iso) {
      const then = new Date(iso).getTime();
      if (Number.isNaN(then)) return fallback.unknown;

      const secs = Math.round((then - Date.now()) / 1000);
      const abs = Math.abs(secs);
      if (abs < 60) return rtf.format(Math.round(secs), "second");

      const mins = Math.round(secs / 60);
      if (Math.abs(mins) < 60) return rtf.format(mins, "minute");

      const hours = Math.round(mins / 60);
      if (Math.abs(hours) < 24) return rtf.format(hours, "hour");

      const days = Math.round(hours / 24);
      if (Math.abs(days) < 30) return rtf.format(days, "day");

      const months = Math.round(days / 30);
      if (Math.abs(months) < 12) return rtf.format(months, "month");

      return rtf.format(Math.round(months / 12), "year");
    },

    count(n) {
      return nf.format(n);
    },

    range(from, to) {
      return `${full(from)}–${full(to)}`;
    },
  };

  cache.set(intl, out);
  return out;
}