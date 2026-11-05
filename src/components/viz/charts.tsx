"use client";

import { useId, useMemo, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { InterestVector, ScoreComponent } from "@/lib/types";
import { INTEREST_AXES } from "@/lib/types";

/* ==================================================================== *
 * Radar chart — interest profile vs department focus
 * ==================================================================== */

interface RadarSeries {
  label: string;
  values: number[];
  color: string;
  fill: string;
  dashed?: boolean;
}

export function RadarChart({
  axes,
  series,
  size = 340,
  className,
  showLegend = true,
}: {
  axes: { key: string; short: string }[];
  series: RadarSeries[];
  size?: number;
  className?: string;
  showLegend?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const uid = useId().replace(/:/g, "");

  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 58;
  const n = axes.length;

  const pointAt = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const r = (Math.max(0, Math.min(100, value)) / 100) * radius;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r] as const;
  };

  const polygon = (values: number[], inset = 0) =>
    values
      .map((v, i) => {
        const [x, y] = pointAt(i, v);
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        return `${(x + Math.cos(angle) * inset).toFixed(2)},${(y + Math.sin(angle) * inset).toFixed(2)}`;
      })
      .join(" ");

  const rings = [25, 50, 75, 100];

  return (
    <div className={cn("relative", className)}>
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-full" role="img" aria-label="Profile comparison radar chart">
        <defs>
          {series.map((s, i) => (
            <radialGradient key={i} id={`${uid}-grad-${i}`}>
              <stop offset="0%" stopColor={s.fill} stopOpacity="0.42" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.08" />
            </radialGradient>
          ))}
        </defs>

        {/* rings */}
        {rings.map((r) => (
          <polygon
            key={r}
            points={polygon(axes.map(() => r))}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-line"
            opacity={r === 100 ? 0.9 : 0.55}
          />
        ))}

        {/* spokes */}
        {axes.map((axis, i) => {
          const [x, y] = pointAt(i, 100);
          return (
            <line
              key={axis.key}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="currentColor"
              strokeWidth="1"
              className="text-line"
              opacity={0.7}
            />
          );
        })}

        {/* series polygons */}
        {series.map((s, si) => (
          <motion.polygon
            key={s.label}
            points={polygon(s.values)}
            fill={`url(#${uid}-grad-${si})`}
            stroke={s.color}
            strokeWidth="2"
            strokeDasharray={s.dashed ? "5 4" : undefined}
            strokeLinejoin="round"
            initial={{ opacity: 0, scale: 0.82 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: si * 0.12, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
        ))}

        {/* vertices */}
        {series.map((s, si) =>
          s.values.map((v, i) => {
            const [x, y] = pointAt(i, v);
            return (
              <motion.circle
                key={`${s.label}-${i}`}
                cx={x}
                cy={y}
                r={hover === i ? 5 : 3.2}
                fill={s.color}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.35 + si * 0.12 }}
              />
            );
          }),
        )}

        {/* labels + hover targets */}
        {axes.map((axis, i) => {
          const [x, y] = pointAt(i, 122);
          const anchor = Math.abs(x - cx) < 12 ? "middle" : x > cx ? "start" : "end";
          return (
            <g key={axis.key}>
              <text
                x={x}
                y={y}
                textAnchor={anchor}
                dominantBaseline="middle"
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  hover === i ? "fill-ink" : "fill-ink-faint",
                )}
              >
                {axis.short}
                {hover === i ? (
                  <tspan className="fill-ink-soft" fontSize="9">
                    {` ${Math.round(series[0]?.values[i] ?? 0)}`}
                  </tspan>
                ) : null}
              </text>
              <circle
                cx={(x + cx) / 2}
                cy={(y + cy) / 2}
                r={26}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                style={{ cursor: "crosshair" }}
              />
            </g>
          );
        })}
      </svg>

      {showLegend ? (
        <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
          {series.map((s) => (
            <li key={s.label} className="flex items-center gap-1.5 text-[11px] text-ink-soft">
              <span className="size-2.5 rounded-sm" style={{ background: s.color }} />
              {s.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Convenience wrapper: student profile vs one department. */
export function InterestRadar({
  interests,
  departmentTags,
  hue,
  className,
}: {
  interests: InterestVector;
  departmentTags: readonly (keyof InterestVector)[];
  hue: number;
  className?: string;
}) {
  const axes = useMemo(() => INTEREST_AXES.map((a) => ({ key: a.key, short: a.short })), []);
  const series: RadarSeries[] = [
    {
      label: "Your profile",
      values: INTEREST_AXES.map((a) => interests[a.key] ?? 0),
      color: "var(--color-cyan-accent)",
      fill: "var(--color-cyan-accent)",
    },
    {
      label: "Department focus",
      values: INTEREST_AXES.map((a) => (departmentTags.includes(a.key) ? 88 : 6)),
      color: `oklch(0.68 0.17 ${hue})`,
      fill: `oklch(0.68 0.17 ${hue})`,
      dashed: true,
    },
  ];

  return <RadarChart axes={axes} series={series} className={className} />;
}

/* ==================================================================== *
 * Radial gauge — composite score
 * ==================================================================== */

export function Gauge({
  value,
  max = 100,
  size = 168,
  label,
  sublabel,
  hue = 250,
  thickness = 11,
}: {
  value: number;
  max?: number;
  size?: number;
  label?: string;
  sublabel?: string;
  hue?: number;
  thickness?: number;
}) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.max(0, Math.min(1, value / max));
  const offset = circumference * (1 - ratio);
  const gradientId = useId().replace(/:/g, "");

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`${Math.round(ratio * 100)} out of ${max}`}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={`oklch(0.7 0.17 ${hue})`} />
            <stop offset="60%" stopColor="var(--color-violet-accent)" />
            <stop offset="100%" stopColor="var(--color-cyan-accent)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={thickness} className="text-surface-3" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <div className="font-display text-4xl leading-none font-semibold text-ink tabular-nums">{Math.round(value)}</div>
        {label ? <div className="mt-1 text-[10px] tracking-widest text-ink-faint uppercase">{label}</div> : null}
        {sublabel ? <div className="mt-0.5 text-[11px] text-ink-soft">{sublabel}</div> : null}
      </div>
    </div>
  );
}

/* ==================================================================== *
 * Component bars — score breakdown
 * ==================================================================== */

export function ScoreBars({ components, className }: { components: ScoreComponent[]; className?: string }) {
  return (
    <ul className={cn("space-y-3", className)}>
      {components.map((c, i) => {
        const share = Math.round(c.weight * 100);
        return (
          <li key={c.key} className="group">
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-ink">
                {c.label}
                <span className="font-mono text-[10px] text-ink-faint">· {share}% weight</span>
              </span>
              <span className="font-mono font-semibold text-ink tabular-nums">{Math.round(c.value)}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3">
              <motion.div
                className="h-full rounded-full bg-linear-to-r from-brand-400 to-violet-accent"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(1, c.value)}%` }}
                transition={{ duration: 0.85, delay: 0.06 * i, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">{c.rationale}</p>
          </li>
        );
      })}
    </ul>
  );
}

/* ==================================================================== *
 * Salary distribution — p25 / median / p75 band
 * ==================================================================== */

export function SalaryBand({
  p25,
  median,
  p75,
  hue = 250,
  benchmark = 75_000,
  className,
}: {
  p25: number;
  median: number;
  p75: number;
  hue?: number;
  benchmark?: number;
  className?: string;
}) {
  const min = 0;
  const max = Math.max(p75 * 1.12, benchmark * 1.9);
  const pos = (v: number) => ((v - min) / (max - min)) * 100;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative h-9 overflow-hidden rounded-lg border border-line bg-surface-2">
        <motion.div
          className="absolute inset-y-0 rounded-lg"
          style={{
            background: `linear-gradient(90deg, oklch(0.6 0.1 ${hue} / 0.16), oklch(0.66 0.16 ${hue} / 0.34))`,
          }}
          initial={{ left: `${pos(p25)}%`, right: `${(100 - pos(p75))}%` }}
          animate={{ left: `${pos(p25)}%`, right: `${(100 - pos(p75))}%` }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.div
          className="absolute inset-y-0 w-0.5 bg-ink/70"
          initial={{ left: `${pos(median)}%` }}
          animate={{ left: `${pos(median)}%` }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
        <div className="absolute inset-y-0 w-px border-l border-dashed border-ink-soft/60" style={{ left: `${pos(benchmark)}%` }} />
      </div>
      <div className="flex justify-between font-mono text-[10px] text-ink-faint tabular-nums">
        <span>${Math.round(p25 / 1000)}k · p25</span>
        <span className="text-ink-soft">
          median ${Math.round(median / 1000)}k
        </span>
        <span>p75 · ${Math.round(p75 / 1000)}k</span>
      </div>
    </div>
  );
}

/* ==================================================================== *
 * Interest profile bars — student questionnaire output
 * ==================================================================== */

export function InterestBars({ interests, className }: { interests: InterestVector; className?: string }) {
  const rows = INTEREST_AXES.map((a) => ({ ...a, value: interests[a.key] ?? 0 })).sort((a, b) => b.value - a.value);
  return (
    <ul className={cn("space-y-2", className)}>
      {rows.map((r, i) => (
        <li key={r.key}>
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="text-ink">{r.label}</span>
            <span className="font-mono text-ink-soft tabular-nums">{r.value}</span>
          </div>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-3">
            <motion.div
              className="h-full rounded-full bg-linear-to-r from-brand-400 to-cyan-accent"
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(0.5, r.value)}%` }}
              transition={{ duration: 0.7, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ==================================================================== *
 * Sparkline — tiny trend arrow
 * ==================================================================== */

export function GrowthSpark({ value, className }: { value: number; className?: string }) {
  const positive = value >= 0;
  return (
    <svg viewBox="0 0 40 20" className={cn("h-5 w-10", className)} role="img" aria-label={`${positive ? "+" : ""}${value}% projected growth`}>
      <path
        d={positive ? "M2 17 L11 12 L18 14 L27 7 L38 3" : "M2 3 L11 8 L18 6 L27 13 L38 17"}
        fill="none"
        stroke={positive ? "var(--color-ok)" : "var(--color-risk)"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={positive ? 38 : 38} cy={positive ? 3 : 17} r="2.5" fill={positive ? "var(--color-ok)" : "var(--color-risk)"} />
    </svg>
  );
}