"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { CircleSlash, RefreshCw, Wifi } from "lucide-react";
import { Badge, Button, Card, Spinner } from "@/components/ui/primitives";
import { FreshnessBadge, MetricTile, ProvenanceNote } from "@/components/market/tiles";
import { SalaryBand } from "@/components/viz/charts";
import { useAdvisor, useAspiration } from "@/lib/store";
import { rankPreliminary } from "@/lib/preliminary";
import { getDepartment } from "@/lib/data/departments";
import { getCareer } from "@/lib/data/careers";
import type { MarketSnapshot } from "@/lib/types";
import { cn } from "@/lib/utils";

interface MarketResponse {
  ok: boolean;
  generatedAt: string;
  elapsedMs: number;
  scope: number;
  sourceCounts: Record<string, number>;
  note?: string;
  error?: string;
  departments: (MarketSnapshot & { id: string; drivers: string[] })[];
}

/** Placeholder used only to keep the freshness badge renderable before data lands. */
const FALLBACK_SNAPSHOT: MarketSnapshot = {
  fetchedAt: new Date(0).toISOString(),
  source: "seed",
  seriesId: "pending",
  metrics: {
    medianSalary: 0,
    salaryP25: 0,
    salaryP75: 0,
    projectedGrowth: 0,
    placementRate: 0,
    demandIndex: 0,
    skillDemand: 0,
    automationExposure: 0,
    sampleSize: 0,
  },
  provenance: "Awaiting first fetch.",
};

export function PhaseMarket() {
  const transcript = useAdvisor((s) => s.transcript);
  const interests = useAdvisor((s) => s.interests);
  const aspiration = useAspiration();

  const [data, setData] = useState<MarketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Only the departments that survived the Phase 3 audit are worth spending
  // market lookups on, so the request is scoped rather than asking for all 20.
  const shortlist = useMemo(
    () => rankPreliminary({ transcript, interests, aspiration, limit: 6 }).map((r) => r.feasibility.departmentId),
    [transcript, interests, aspiration],
  );
  const shortlistKey = shortlist.join(",");

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/market?ids=${shortlistKey}`)
      .then((r) => r.json())
      .then((json: MarketResponse) => {
        if (!json.ok) throw new Error(json.error ?? "Market data unavailable");
        setData(json);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [shortlistKey]);

  useEffect(() => {
    load();
  }, [load]);

  const anyLive = data ? Object.keys(data.sourceCounts).some((k) => k === "live") : false;

  return (
    <div className="space-y-6">
      <Card glass className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="font-display text-xl font-semibold text-ink">Labour market context</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Pay and outlook for the occupations these departments actually feed, from the Bureau of Labor Statistics Occupational Employment and Wage
              Statistics. This is context, not a verdict — it is the last input added, and it can only re-rank departments that already survived the prerequisite
              audit.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {data ? <FreshnessBadge snapshot={data.departments[0] ?? FALLBACK_SNAPSHOT} /> : null}
            <Button variant="ghost" size="sm" onClick={load} disabled={loading} icon={loading ? <Spinner className="size-3.5" /> : <RefreshCw className="size-3.5" />}>
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <Card glass className="p-12 text-center">
          <Spinner className="mx-auto" />
          <p className="mt-4 text-sm text-ink-soft">Fetching BLS series for {shortlist.length} departments…</p>
          <p className="mt-1 text-[11px] text-ink-faint">First load can take several seconds while the upstream request is made.</p>
        </Card>
      ) : error ? (
        <Card className="border-risk/35 bg-risk/6 p-8 text-center">
          <CircleSlash className="mx-auto size-6 text-risk" />
          <p className="mt-3 text-sm font-medium text-ink">Market data could not be loaded</p>
          <p className="mt-1 text-[12px] text-ink-soft">{error}</p>
          <Button variant="secondary" size="sm" onClick={load} className="mt-4">
            Try again
          </Button>
        </Card>
      ) : data ? (
        <>
          {!anyLive ? (
            <Card className="border-warn/35 bg-warn/6 p-5">
              <div className="flex items-start gap-3">
                <Wifi className="mt-0.5 size-4 shrink-0 text-warn" />
                <div>
                  <h4 className="text-sm font-medium text-ink">Showing published reference figures</h4>
                  <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">
                    The live BLS endpoint declined to answer right now, so every figure below is from the curated reference set rather than a fresh pull. The numbers
                    are real published values — they are simply not freshly retrieved. The phase still works; the report will say which it used.
                  </p>
                </div>
              </div>
            </Card>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            {data.departments.map((d, i) => {
              const dept = getDepartment(d.id);
              if (!dept) return null;
              const m = d.metrics;
              const growthPositive = m.projectedGrowth >= 0;
              return (
                <motion.div key={d.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.4 }}>
                  <Card glass className="h-full p-5">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-display text-base font-semibold text-ink">{dept.name}</h3>
                        <p className="mt-0.5 text-[11px] text-ink-faint">{dept.careerIds.slice(0, 2).map((id) => getCareer(id)?.title ?? id).join(" · ")}</p>
                      </div>
                      <span
                        className="grid size-9 shrink-0 place-items-center rounded-lg font-display text-xs font-semibold"
                        style={{ background: `oklch(0.7 0.15 ${dept.hue} / 0.16)`, color: `oklch(0.62 0.17 ${dept.hue})` }}
                      >
                        {dept.shortName.slice(0, 3)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <MetricTile label="Median pay" value={`$${Math.round(m.medianSalary / 1000)}k`} sub="per year, national" />
                      <MetricTile
                        label="Projected growth"
                        value={`${growthPositive ? "+" : ""}${m.projectedGrowth.toFixed(1)}%`}
                        sub="next decade"
                        tone={growthPositive ? (m.projectedGrowth > 8 ? "ok" : "neutral") : "risk"}
                      />
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="mb-1.5 flex items-baseline justify-between text-[11px]">
                          <span className="text-ink-soft">Middle 50% of pay</span>
                          <span className="font-mono text-ink-faint">
                            ${Math.round(m.salaryP25 / 1000)}k – ${Math.round(m.salaryP75 / 1000)}k
                          </span>
                        </div>
                        <SalaryBand p25={m.salaryP25} median={m.medianSalary} p75={m.salaryP75} hue={dept.hue} />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <Mini label="Stability" value={m.demandIndex} invert />
                        <Mini label="Automation" value={m.automationExposure} invert />
                        <Mini label="Skills demand" value={m.skillDemand} />
                      </div>
                    </div>

                    {d.drivers.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {d.drivers.slice(0, 3).map((drv) => (
                          <Badge key={drv} tone="neutral">
                            {drv}
                          </Badge>
                        ))}
                      </div>
                    ) : null}

                    <ProvenanceNote snapshot={d} className="mt-4" />
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {data.note ? <p className="text-[11px] leading-relaxed text-ink-faint">{data.note}</p> : null}
        </>
      ) : null}
    </div>
  );
}

function Mini({ label, value, invert }: { label: string; value: number; invert?: boolean }) {
  const good = invert ? value >= 60 : value >= 60;
  return (
    <div className="rounded-lg border border-line bg-surface-2/60 px-2.5 py-2">
      <div className={cn("font-display text-base leading-none font-semibold tabular-nums", good ? "text-ok" : "text-warn")}>{Math.round(value)}</div>
      <div className="mt-1 text-[9px] leading-tight tracking-wide text-ink-faint uppercase">{label}</div>
    </div>
  );
}
