/**
 * BLS OEWS series contract — verified empirically against api.bls.gov.
 *
 * Series ID layout (national, not seasonally adjusted):
 *   "OE"  + seasonal("U") + scope("N") + area(7) + industry(6) + occupation(6) + datatype(2)
 *
 * Datatype codes were confirmed by probing the live endpoint:
 *   01 employment · 03 mean hourly · 04 mean annual · 05 % of national employment
 *   06/07/08/09/10 hourly P10/P25/P50/P75/P90 · 11/12/13/14/15 annual P10/P25/P50/P75/P90
 */

export const BLS_API_ROOT = "https://api.bls.gov/publicAPI";
/**
 * v1 accepts up to 25 series per request and 25 requests/day per IP without a
 * registration key. v2 raises this to 50 series and 500 queries/day.
 */
export const BLS_MAX_SERIES_PER_REQUEST = 25;
export const BLS_V1_DAILY_LIMIT = 25;
export const BLS_V2_DAILY_LIMIT = 500;

/**
 * BLS returns this exact message when the anonymous daily quota is spent. It is
 * not a transient fault: retrying only burns more budget, so callers must treat
 * it as terminal-for-today and fall back to the reference dataset.
 */
export const BLS_QUOTA_EXHAUSTED = /daily threshold for total number of requests/i;

export const OEWS = {
  EMPLOYMENT: "01",
  PCT_OF_EMPLOYMENT: "05",
  MEAN_ANNUAL: "04",
  MEAN_HOURLY: "03",
  P10: "11",
  P25: "12",
  MEDIAN: "13",
  P75: "14",
  P90: "15",
} as const;

export type OewsDatatype = (typeof OEWS)[keyof typeof OEWS];

const AREA_NATIONAL = "0000000";
const INDUSTRY_ALL = "000000";

/** Strip SOC punctuation: "15-1252" -> "151252". */
export function socDigits(soc: string): string {
  return soc.replace(/\D/g, "");
}

/** Build a national OEWS series ID. Returns null for malformed SOC input. */
export function oewsSeriesId(soc: string, datatype: OewsDatatype): string | null {
  const occ = socDigits(soc);
  if (occ.length !== 6) return null;
  return `OEU${`N`}${AREA_NATIONAL}${INDUSTRY_ALL}${occ}${datatype}`;
}

/**
 * Plausibility envelopes. BLS occasionally returns values from a different
 * data vintage or a differently-scoped series; anything outside these bounds
 * is discarded so the seed value wins instead of poisoning the report.
 */
export const SANE_BOUNDS = {
  employment: { min: 200, max: 12_000_000 },
  wage: { min: 12_000, max: 420_000 },
  pctOfEmployment: { min: 0.001, max: 30 },
} as const;

export function isSaneNumber(value: unknown, bounds: { min: number; max: number }): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= bounds.min && value <= bounds.max;
}

/** Shape of the v1 response we actually depend on. */
export interface BlsSeriesResult {
  seriesID: string;
  data?: { year: string; period: string; periodName: string; value: string }[];
}

export interface BlsBatchResponse {
  status: string;
  message?: string[];
  Results?: { series: BlsSeriesResult[] };
}

/** Optional free registration key unlocks the v2 limits. */
export function blsRegistrationKey(): string | undefined {
  return process.env.BLS_API_KEY || process.env.BLS_REGISTRATION_KEY || undefined;
}

export function blsApiVersion(key?: string): "v1" | "v2" {
  return key ? "v2" : "v1";
}

export function parseBlsValue(raw: string | undefined): number | null {
  if (raw === undefined || raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}