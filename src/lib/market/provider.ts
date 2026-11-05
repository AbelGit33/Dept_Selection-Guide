import { cache } from "react";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  BLS_API_ROOT,
  BLS_MAX_SERIES_PER_REQUEST,
  BLS_QUOTA_EXHAUSTED,
  BLS_V1_DAILY_LIMIT,
  blsApiVersion,
  blsRegistrationKey,
  isSaneNumber,
  OEWS,
  oewsSeriesId,
  parseBlsValue,
  SANE_BOUNDS,
  type BlsBatchResponse,
  type OewsDatatype,
} from "@/lib/market/series";
import {
  DEMAND_INDEX_NOTE,
  NATIONAL_MEDIAN_ANCHOR,
  socReference,
  SOC_REFERENCE,
  type SocReference,
} from "@/lib/market/reference";
import type { MarketMetric, MarketSnapshot, MarketSource } from "@/lib/types";
import { DEPARTMENTS, getDepartment } from "@/lib/data/departments";
import { rolesForDepartment } from "@/lib/data/careers";

/* ------------------------------------------------------------ tunables */

const FETCH_TIMEOUT_MS = 12_000;
const MAX_ATTEMPTS = 2;
const RETRY_BASE_MS = 400;
/**
 * BLS v1 allows 25 requests/day without a key. A full catalogue fetch is a
 * handful of batched calls, so a long TTL keeps us comfortably inside budget
 * even across a busy day of traffic.
 */
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const STALE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/* ----------------------------------------------------------- transport */

interface CacheEnvelope {
  fetchedAt: number;
  ok: boolean;
  /** Series ID -> numeric value. */
  values: Record<string, number>;
  /** Series IDs BLS answered with, even if the value failed a sanity check. */
  answered: string[];
  note: string;
  /** True when the anonymous daily quota is spent; stop trying until tomorrow. */
  quotaExhausted: boolean;
}

/**
 * BLS anonymous v1 allows 25 requests/day per IP. An in-memory cache alone is
 * not enough: any dev-server restart or redeploy would reset it and re-spend
 * the budget until the quota dies mid-session. So we persist the fetched values
 * to disk for the full TTL.
 */
const memoryCache = new Map<string, CacheEnvelope>();

function cacheDir(): string {
  const local = join(process.cwd(), ".next", "cache");
  try {
    if (existsSync(process.cwd())) return local;
  } catch {
    /* fall through */
  }
  return join(tmpdir(), "dsg-market-cache");
}

let diskCacheWarned = false;

async function readDiskCache(key: string): Promise<CacheEnvelope | null> {
  try {
    const path = join(cacheDir(), `bls-${key}.json`);
    const raw = await readFile(path, "utf8");
    const parsed = JSON.parse(raw) as CacheEnvelope;
    return parsed && typeof parsed.fetchedAt === "number" ? parsed : null;
  } catch {
    return null;
  }
}

async function writeDiskCache(key: string, envelope: CacheEnvelope): Promise<void> {
  try {
    const dir = cacheDir();
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, `bls-${key}.json`), JSON.stringify(envelope), "utf8");
  } catch {
    if (!diskCacheWarned) {
      diskCacheWarned = true;
      console.warn("[market] disk cache unavailable; falling back to in-memory only");
    }
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

class QuotaExhaustedError extends Error {}

async function fetchBlsBatch(seriesIds: string[]): Promise<{ values: Record<string, number>; answered: string[] }> {
  const values: Record<string, number> = {};
  const answered: string[] = [];

  if (seriesIds.length === 0) return { values, answered };

  const key = blsRegistrationKey();
  const endpoint = `${BLS_API_ROOT}/${blsApiVersion(key)}/timeseries/data/`;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: key ? { "Content-Type": "application/json", "X-KEY": key } : { "Content-Type": "application/json" },
        body: JSON.stringify(key ? { seriesid: seriesIds, registrationkey: key } : { seriesid: seriesIds }),
        signal: controller.signal,
        cache: "no-store",
      }).finally(() => clearTimeout(timer));

      if (!res.ok) throw new Error(`BLS responded ${res.status}`);

      const json = (await res.json()) as BlsBatchResponse;
      if (json.status !== "REQUEST_SUCCEEDED") {
        const message = (json.message ?? []).join("; ");
        // Terminal for the day — retrying would only consume more budget.
        if (BLS_QUOTA_EXHAUSTED.test(message)) throw new QuotaExhaustedError(message);
        throw new Error(`BLS status=${json.status} ${message}`);
      }

      for (const series of json.Results?.series ?? []) {
        answered.push(series.seriesID);
        // Prefer the annual average, then the most recent year available.
        const annual = (series.data ?? []).find((d) => d.period === "A01");
        const parsed = parseBlsValue(annual?.value ?? series.data?.[0]?.value);
        if (parsed !== null) values[series.seriesID] = parsed;
      }
      return { values, answered };
    } catch (err) {
      lastError = err;
      if (err instanceof QuotaExhaustedError) throw err;
      if (attempt < MAX_ATTEMPTS - 1) await sleep(RETRY_BASE_MS * (attempt + 1));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unknown BLS transport failure");
}

/* ------------------------------------------------------------ key input */

export interface LiveSeriesPlan {
  /** Everything needed to render every department's market card. */
  socs: string[];
  datatypes: OewsDatatype[];
}

export const DATATYPES_NEEDED: OewsDatatype[] = [
  OEWS.EMPLOYMENT,
  OEWS.MEAN_ANNUAL,
  OEWS.P25,
  OEWS.MEDIAN,
  OEWS.P75,
];

function planFromSocs(socs: string[]): LiveSeriesPlan {
  return { socs: [...new Set(socs)].sort(), datatypes: DATATYPES_NEEDED };
}

function envelopeKey(plan: LiveSeriesPlan): string {
  const hash = plan.socs.reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 100_000_007, 7);
  return `${plan.socs.length}-${hash}-${plan.datatypes.join("")}-${blsApiVersion(blsRegistrationKey())}`;
}

/** Fetch (or reuse) live OEWS values for the requested occupations. */
export async function loadLiveSeries(plan: LiveSeriesPlan): Promise<CacheEnvelope> {
  const key = envelopeKey(plan);
  const now = Date.now();
  const fresh = (e: CacheEnvelope) => now - e.fetchedAt < CACHE_TTL_MS;

  const hit = memoryCache.get(key);
  if (hit && (fresh(hit) || (hit.quotaExhausted && now - hit.fetchedAt < STALE_TTL_MS))) return hit;

  const onDisk = await readDiskCache(key);
  if (onDisk && (fresh(onDisk) || (onDisk.quotaExhausted && now - onDisk.fetchedAt < STALE_TTL_MS))) {
    memoryCache.set(key, onDisk);
    return onDisk;
  }

  const seriesIds: string[] = [];
  for (const soc of plan.socs) {
    for (const datatype of plan.datatypes) {
      const id = oewsSeriesId(soc, datatype);
      if (id) seriesIds.push(id);
    }
  }

  const values: Record<string, number> = {};
  const answered: string[] = [];
  const errors: string[] = [];
  let requestsUsed = 0;
  let quotaExhausted = false;

  const key2 = blsRegistrationKey();
  const dailyBudget = key2 ? 500 : BLS_V1_DAILY_LIMIT;
  const batches = chunk(seriesIds, BLS_MAX_SERIES_PER_REQUEST);

  if (batches.length > dailyBudget) {
    // Rather than blowing the quota, take the most valuable slice and say so.
    errors.push(`Catalogue needs ${batches.length} requests but the daily budget is ${dailyBudget}; fetched the first ${dailyBudget}.`);
  }

  for (const batch of batches.slice(0, dailyBudget)) {
    try {
      requestsUsed += 1;
      const batchResult = await fetchBlsBatch(batch);
      Object.assign(values, batchResult.values);
      answered.push(...batchResult.answered);
    } catch (err) {
      if (err instanceof QuotaExhaustedError) {
        quotaExhausted = true;
        errors.push(err.message);
        break;
      }
      errors.push(err instanceof Error ? err.message : "batch failed");
    }
  }

  const ok = errors.length === 0 && answered.length > 0;
  const envelope: CacheEnvelope = {
    fetchedAt: Date.now(),
    ok,
    values,
    answered,
    quotaExhausted,
    note: ok
      ? `${answered.length} of ${seriesIds.length} series returned by BLS across ${requestsUsed} request(s).`
      : quotaExhausted
        ? `BLS anonymous daily quota exhausted after ${requestsUsed} request(s). ${errors[0] ?? ""}`.trim()
        : errors.join("; ") || "BLS returned no series.",
  };

  memoryCache.set(key, envelope);
  // Persist so a dev restart or redeploy does not re-spend the day's budget.
  await writeDiskCache(key, envelope);
  return envelope;
}

/* ------------------------------------------------------------ merging */

interface MergedOccupation {
  employment: number | null;
  mean: number | null;
  p25: number | null;
  median: number | null;
  p75: number | null;
  /** Count of fields taken from the live API. */
  liveFields: number;
  reference: SocReference | null;
  /** Total fields we had a reference value for. */
  referenceFields: number;
}

function readLive(envelope: CacheEnvelope, soc: string, datatype: OewsDatatype, bounds: { min: number; max: number }): number | null {
  const id = oewsSeriesId(soc, datatype);
  if (!id) return null;
  if (!envelope.answered.includes(id)) return null;
  const raw = envelope.values[id];
  return isSaneNumber(raw, bounds) ? raw : null;
}

function mergeOccupation(soc: string, envelope: CacheEnvelope): MergedOccupation {
  const reference = socReference(soc) ?? null;
  const wageBounds = SANE_BOUNDS.wage;
  const empBounds = SANE_BOUNDS.employment;

  const liveMedian = readLive(envelope, soc, OEWS.MEDIAN, wageBounds);
  const liveP25 = readLive(envelope, soc, OEWS.P25, wageBounds);
  const liveP75 = readLive(envelope, soc, OEWS.P75, wageBounds);
  const liveMean = readLive(envelope, soc, OEWS.MEAN_ANNUAL, wageBounds);
  const liveEmployment = readLive(envelope, soc, OEWS.EMPLOYMENT, empBounds);

  const referenceFields = reference ? 5 : 0;
  const liveFields = [liveMedian, liveP25, liveP75, liveMean, liveEmployment].filter((v) => v !== null).length;

  return {
    employment: liveEmployment ?? reference?.employment ?? null,
    mean: liveMean ?? reference?.mean ?? null,
    p25: liveP25 ?? reference?.p25 ?? null,
    median: liveMedian ?? reference?.median ?? null,
    p75: liveP75 ?? reference?.p75 ?? null,
    liveFields,
    reference,
    referenceFields,
  };
}

/**
 * Modelled 0–100 demand index. Blends current employment volume (log-scaled so
 * a 3M-person field is high but not dominant) with projected growth.
 */
function demandIndex(employment: number, growthPct: number): number {
  const volume = Math.log10(Math.max(employment, 1_000) / 1_000) / Math.log10(12_000); // ~3M+ => 1.0
  const growth = Math.max(0, Math.min(growthPct, 45)) / 45;
  return Math.round(Math.max(0, Math.min(1, volume * 0.45 + growth * 0.55)) * 100);
}

export interface OccupationAggregate {
  socs: string[];
  metrics: MarketMetric;
  source: MarketSource;
  liveShare: number;
  seriesId: string;
  /** Human-readable list of which occupations drove the aggregate. */
  drivers: string[];
}

export function aggregateOccupations(socs: string[], envelope: CacheEnvelope): OccupationAggregate {
  const unique = [...new Set(socs)];
  const merged = unique.map((soc) => mergeOccupation(soc, envelope));

  const withEmployment = merged.filter((m) => m.employment && m.employment > 0);
  const weightOf = (m: MergedOccupation) => m.employment ?? 1;

  const weighted = (pick: (m: MergedOccupation) => number | null, fallback: number) => {
    const usable = withEmployment.filter((m) => pick(m) !== null);
    if (usable.length === 0) return fallback;
    const sum = usable.reduce((acc, m) => acc + (pick(m) as number) * weightOf(m), 0);
    const w = usable.reduce((acc, m) => acc + weightOf(m), 0) || 1;
    return sum / w;
  };

  const fallbackRef = SOC_REFERENCE[0];
  const medianSalary = Math.round(weighted((m) => m.median, fallbackRef?.median ?? NATIONAL_MEDIAN_ANCHOR));
  const salaryP25 = Math.round(weighted((m) => m.p25, fallbackRef?.p25 ?? 40_000));
  const salaryP75 = Math.round(weighted((m) => m.p75, fallbackRef?.p75 ?? 150_000));
  const employment = Math.round(withEmployment.reduce((sum, m) => sum + (m.employment ?? 0), 0) || (fallbackRef?.employment ?? 10_000));

  // Projected growth: exposure-weighted mean of the constituent occupations.
  const growthRefs = merged.map((m) => m.reference).filter((r): r is SocReference => Boolean(r));
  const projectedGrowth = growthRefs.length
    ? Number(
        (
          growthRefs.reduce((sum, r) => sum + r.projectedGrowthPct * Math.min(r.employment, 500_000), 0) /
          (growthRefs.reduce((sum, r) => sum + Math.min(r.employment, 500_000), 0) || 1)
        ).toFixed(1),
      )
    : 0;

  const automationExposure = Math.round(
    growthRefs.length
      ? growthRefs.reduce((sum, r) => sum + r.automationExposure * Math.min(r.employment, 500_000), 0) /
        (growthRefs.reduce((sum, r) => sum + Math.min(r.employment, 500_000), 0) || 1)
      : 45,
  );

  const sampleSize = growthRefs.reduce((sum, r) => sum + r.employment, 0) || employment;

  const liveShare = merged.length ? merged.reduce((s, m) => s + m.liveFields, 0) / (merged.length * 5) : 0;
  const source: MarketSource = liveShare >= 0.8 ? "live" : envelope.ok ? "cached" : "seed";

  const metrics: MarketMetric = {
    medianSalary,
    salaryP25,
    salaryP75,
    projectedGrowth,
    placementRate: 0,
    demandIndex: demandIndex(employment, projectedGrowth),
    skillDemand: 0,
    automationExposure,
    sampleSize,
  };

  return {
    socs: unique,
    metrics,
    source,
    liveShare: Number(liveShare.toFixed(2)),
    seriesId: unique.map((s) => oewsSeriesId(s, OEWS.MEDIAN) ?? s).join(","),
    drivers: merged
      .filter((m) => m.reference)
      .sort((a, b) => (b.employment ?? 0) - (a.employment ?? 0))
      .slice(0, 4)
      .map((m) => m.reference?.title ?? ""),
  };
}

/* ------------------------------------------------- placement heuristic */

/**
 * Six-month placement is not published per occupation, so we estimate it from
 * labour-market structure: broad-demand roles with easy-to-observed entry
 * place better than narrow research pipelines. Documented as an estimate.
 */
export function estimatePlacementRate(socs: string[], demandIndexValue: number, automationExposure: number): number {
  const refs = socs.map(socReference).filter((r): r is SocReference => Boolean(r));
  const breadth = refs.length === 0 ? 0.45 : Math.min(1, refs.reduce((s, r) => s + Math.min(r.employment, 800_000) / 800_000, 0) / refs.length);
  const demand = demandIndexValue / 100;
  const automationDrag = automationExposure / 100;
  return Number(Math.max(0.42, Math.min(0.98, 0.5 + breadth * 0.22 + demand * 0.2 - automationDrag * 0.14)).toFixed(3));
}

/* ------------------------------------------------------- public entry */

/** Most common wage year across the constituent occupations. */
function wageYearOf(socs: string[]): string {
  const years = socs.map((s) => socReference(s)?.wageYear).filter((y): y is number => Boolean(y));
  if (years.length === 0) return "unknown";
  const tally = new Map<number, number>();
  for (const y of years) tally.set(y, (tally.get(y) ?? 0) + 1);
  return [...tally.entries()].sort((a, b) => b[1] - a[1])[0][0].toString();
}

export interface DepartmentMarket {
  departmentId: string;
  snapshot: MarketSnapshot;
  drivers: string[];
}

export function buildSnapshot(departmentId: string, socs: string[], envelope: CacheEnvelope): DepartmentMarket {
  const agg = aggregateOccupations(socs, envelope);
  const metrics: MarketMetric = {
    ...agg.metrics,
    placementRate: estimatePlacementRate(socs, agg.metrics.demandIndex, agg.metrics.automationExposure),
    skillDemand: Math.round(Math.max(0, Math.min(100, agg.metrics.demandIndex * 0.6 + agg.metrics.projectedGrowth * 1.6))),
  };

  const provenance =
    agg.source === "live"
      ? `Live BLS OEWS values for ${Math.round(agg.liveShare * 100)}% of the wage and employment fields. ${envelope.note}`
      : agg.source === "cached"
        ? `BLS responded but omits most OEWS series for these occupations, so fields are blended from the last published BLS release. ${envelope.note}`
        : envelope.quotaExhausted
          ? `The BLS API's anonymous daily request quota is spent, so live values are unavailable right now. Figures are from the last published BLS release (wage year ${wageYearOf(socs)}).`
          : `BLS was unreachable (${envelope.note}). Figures are from the last published BLS release (wage year ${wageYearOf(socs)}).`;

  return {
    departmentId,
    snapshot: {
      fetchedAt: new Date(envelope.fetchedAt).toISOString(),
      source: agg.source,
      seriesId: agg.seriesId,
      metrics,
      provenance,
    },
    drivers: agg.drivers.filter(Boolean),
  };
}

/** SOC codes a department's market figure should be built from. */
export function socsForDepartment(departmentId: string): string[] {
  const dept = getDepartment(departmentId);
  if (!dept) return [];
  return [
    ...new Set(
      rolesForDepartment(dept.careerIds).flatMap((role) => role.soc),
    ),
  ];
}

/**
 * React `cache` dedupes identical calls within a single render pass, so the
 * landing page and the advisor can both request the catalogue cheaply.
 */
export const getAllMarketData = cache(async (): Promise<DepartmentMarket[]> => {
  const departmentIds = DEPARTMENTS.map((d) => d.id);
  const socs = [...new Set(departmentIds.flatMap(socsForDepartment))];
  const plan = planFromSocs(socs.length ? socs : SOC_REFERENCE.map((r) => r.soc));
  const envelope = await loadLiveSeries(plan);
  return departmentIds.map((id) => buildSnapshot(id, socsForDepartment(id), envelope));
});

/** @internal used by tests and the route handlers. */
export async function getMarketForDepartment(departmentId: string, socs: string[]): Promise<DepartmentMarket> {
  const plan = planFromSocs(socs);
  const envelope = await loadLiveSeries(plan);
  return buildSnapshot(departmentId, socs, envelope);
}

export { DEMAND_INDEX_NOTE };