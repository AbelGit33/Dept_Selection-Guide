"use client";

import { Badge } from "@/components/ui/primitives";
import type { MarketSnapshot, MarketSource } from "@/lib/types";
import { cn, relativeTime, signedPct, usd } from "@/lib/utils";
import { Activity, Database, Radio, RefreshCw } from "lucide-react";

const SOURCE_META: Record<MarketSource, { label: string; tone: "ok" | "warn" | "neutral"; icon: typeof Radio; blurb: string }> = {
  live: {
    label: "Live",
    tone: "ok",
    icon: Radio,
    blurb: "Wage and employment figures read directly from the BLS API just now.",
  },
  cached: {
    label: "Partially live",
    tone: "warn",
    icon: RefreshCw,
    blurb: "BLS responded but does not publish a series for every occupation here, so some fields use the last published release.",
  },
  seed: {
    label: "Last published release",
    tone: "neutral",
    icon: Database,
    blurb: "The BLS API was unreachable. Figures come from the last published release and are clearly stale.",
  },
};

export function FreshnessBadge({ snapshot, className, showText = true }: { snapshot: MarketSnapshot; className?: string; showText?: boolean }) {
  const meta = SOURCE_META[snapshot.source];
  const Icon = meta.icon;
  return (
    <Badge tone={meta.tone} className={className} title={`${meta.blurb} · fetched ${relativeTime(snapshot.fetchedAt)}`}>
      <Icon className={cn("size-3", snapshot.source === "live" && "animate-pulse")} />
      {showText ? meta.label : null}
      <span className="text-ink-faint">· {relativeTime(snapshot.fetchedAt)}</span>
    </Badge>
  );
}

export function ProvenanceNote({ snapshot, className }: { snapshot: MarketSnapshot; className?: string }) {
  const meta = SOURCE_META[snapshot.source];
  return (
    <div className={cn("rounded-xl border border-line bg-surface-2/60 px-3.5 py-3", className)}>
      <div className="flex items-center gap-2 text-xs font-medium text-ink">
        <Activity className="size-3.5 text-brand-500" />
        Data provenance
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-ink-soft">{snapshot.provenance}</p>
      <p className="mt-1.5 text-[11px] leading-relaxed text-ink-soft">{meta.blurb}</p>
      <p className="mt-2 font-mono text-[10px] break-all text-ink-faint">series: {snapshot.seriesId.split(",").slice(0, 3).join(", ")}</p>
    </div>
  );
}

export function MetricTile({
  label,
  value,
  sub,
  tone = "neutral",
  className,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "ok" | "warn" | "risk";
  className?: string;
}) {
  const tones = {
    neutral: "text-ink",
    ok: "text-ok",
    warn: "text-warn",
    risk: "text-risk",
  };
  return (
    <div className={cn("rounded-xl border border-line bg-surface-2/60 px-3.5 py-3", className)}>
      <div className="text-[10px] font-medium tracking-widest text-ink-faint uppercase">{label}</div>
      <div className={cn("mt-1 font-display text-xl leading-tight font-semibold tabular-nums", tones[tone])}>{value}</div>
      {sub ? <div className="mt-0.5 text-[11px] text-ink-soft">{sub}</div> : null}
    </div>
  );
}

export function MarketSummary({ snapshot, className }: { snapshot: MarketSnapshot; className?: string }) {
  const m = snapshot.metrics;
  return (
    <div className={cn("grid grid-cols-2 gap-2.5 sm:grid-cols-4", className)}>
      <MetricTile
        label="Median pay"
        value={usd(m.medianSalary, { compact: true })}
        sub={`${usd(m.salaryP25, { compact: true })}–${usd(m.salaryP75, { compact: true })}`}
      />
      <MetricTile
        label="10-yr growth"
        value={signedPct(m.projectedGrowth)}
        sub="BLS projection"
        tone={m.projectedGrowth >= 8 ? "ok" : m.projectedGrowth >= 3 ? "neutral" : "warn"}
      />
      <MetricTile label="Demand index" value={`${m.demandIndex}/100`} sub="modelled, not published" />
      <MetricTile
        label="Automation risk"
        value={`${m.automationExposure}%`}
        sub={`placement est. ${Math.round(m.placementRate * 100)}%`}
        tone={m.automationExposure >= 60 ? "risk" : m.automationExposure >= 42 ? "warn" : "ok"}
      />
    </div>
  );
}