"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Compass,
  Download,
  FileText,
  Info,
  Layers,
  Printer,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Badge, Button, Card, Progress, Spinner } from "@/components/ui/primitives";
import { FreshnessBadge, MarketSummary, ProvenanceNote } from "@/components/market/tiles";
import { Gauge, SalaryBand, ScoreBars } from "@/components/viz/charts";
import { getCareer } from "@/lib/data/careers";
import {
  INTEREST_AXES,
  type DepartmentScore,
  type FeasibilityReport,
  type RecommendationReport,
  type ScoreComponent,
} from "@/lib/types";
import { cn, gpa, pct, signedPct, usd } from "@/lib/utils";

const BAND_TONE = {
  exceptional: "ok",
  strong: "brand",
  viable: "warn",
  speculative: "risk",
} as const;

const SEVERITY_META = {
  info: { icon: Info, tone: "neutral", label: "Note", ring: "border-line bg-surface-2/50", iconClass: "text-ink-faint" },
  watch: { icon: CircleAlert, tone: "warn", label: "Watch", ring: "border-warn/35 bg-warn/6", iconClass: "text-warn" },
  high: { icon: AlertTriangle, tone: "risk", label: "High", ring: "border-risk/35 bg-risk/6", iconClass: "text-risk" },
} as const;

const READINESS_META: Record<
  FeasibilityReport["status"],
  { label: string; badge: "ok" | "brand" | "warn" | "risk"; text: string }
> = {
  clear: { label: "Clear", badge: "ok", text: "text-ok" },
  workable: { label: "Workable", badge: "brand", text: "text-ink" },
  "at-risk": { label: "At risk", badge: "warn", text: "text-warn" },
  blocked: { label: "Blocked", badge: "risk", text: "text-risk" },
};

const SECTIONS = [
  { id: "profile-summary", label: "Profile" },
  { id: "top-3", label: "Shortlist" },
  { id: "runners-up", label: "Runners-up" },
  { id: "risks", label: "Risks" },
  { id: "blind-spots", label: "Blind spots" },
  { id: "next-steps", label: "Next steps" },
] as const;

export function ReportView({ report, loading, onRegenerate }: { report: RecommendationReport | null; loading: boolean; onRegenerate: () => void }) {
  const [active, setActive] = useState<string>(SECTIONS[0].id);
  const [expanded, setExpanded] = useState<string[]>([]);

  // Scroll-spy. Sections are registered after the report renders, so this has
  // to re-run whenever a new report replaces the old one.
  useEffect(() => {
    if (!report) return;
    const seen = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: 0 },
    );
    const nodes = SECTIONS.map((s) => document.getElementById(s.id)).filter((n): n is HTMLElement => Boolean(n));
    for (const n of nodes) seen.observe(n);
    return () => seen.disconnect();
  }, [report]);

  // A fresh report should collapse back to the summary view, not inherit the
  // previous report's open panels.
  useEffect(() => setExpanded([]), [report]);

  const toggle = (id: string) => setExpanded((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  if (loading) {
    return (
      <Card glass className="p-16 text-center">
        <Spinner className="mx-auto" />
        <p className="mt-4 text-sm text-ink-soft">Assembling your report…</p>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card glass className="p-10 text-center">
        <Compass className="mx-auto size-8 text-ink-faint" />
        <h2 className="mt-4 font-display text-xl font-semibold text-ink">No report yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
          Complete Phases 1 to 4, then generate the report to see your ranked shortlist.
        </p>
        <Button onClick={onRegenerate} className="mt-5" icon={<Sparkles className="size-4" />}>
          Generate now
        </Button>
      </Card>
    );
  }

  const lead = report.top3[0];
  const stamp = new Date(report.generatedAt);
  const filename = `dept-selection-report-${stamp.toISOString().slice(0, 10)}`;
  const highRisk = report.risks.filter((r) => r.severity === "high").length;

  const download = (name: string, contents: string, mime: string) => {
    const blob = new Blob([contents], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJson = () => download(`${filename}.json`, JSON.stringify(report, null, 2), "application/json");
  const exportMarkdown = () => download(`${filename}.md`, toMarkdown(report), "text/markdown");

  return (
    <div className="print-doc space-y-10">
      {/* --------------------------------------------------------- header */}
      <Card glass className="print-block p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold text-ink">Recommendation Report</h1>
              <Badge tone="ok">Final</Badge>
              {highRisk > 0 ? <Badge tone="risk">{highRisk} high-severity risk</Badge> : null}
            </div>
            <p className="mt-1.5 text-[12px] text-ink-soft">
              Generated {stamp.toLocaleString()} · {report.poolSize} departments scored · this is a snapshot of published data, not a live guarantee.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onRegenerate} icon={<RefreshCw className="size-3.5" />}>
              Regenerate
            </Button>
            <Button variant="secondary" size="sm" onClick={exportMarkdown} icon={<FileText className="size-3.5" />}>
              Notes
            </Button>
            <Button variant="secondary" size="sm" onClick={exportJson} icon={<Download className="size-3.5" />}>
              JSON
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()} icon={<Printer className="size-3.5" />}>
              Print
            </Button>
          </div>
        </div>

        {lead ? (
          <div className="mt-6 grid gap-5 border-t border-line pt-5 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="flex justify-center">
              <Gauge value={lead.total} label="fit score" sublabel={`rank 1 of ${report.top3.length}`} hue={lead.department.hue} size={148} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium tracking-widest text-ink-faint uppercase">Leading recommendation</p>
              <h2 className="mt-1 font-display text-xl font-semibold text-ink">{lead.department.name}</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{lead.department.tagline}</p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <Badge tone={BAND_TONE[lead.band]}>{lead.band}</Badge>
                <Badge tone="neutral">{lead.confidence} confidence</Badge>
                <Badge tone={READINESS_META[lead.feasibility.status].badge}>
                  Prerequisites {READINESS_META[lead.feasibility.status].label.toLowerCase()}
                </Badge>
                <Badge tone={lead.market.source === "live" ? "ok" : "warn"}>{lead.market.source === "live" ? "Live BLS" : "Reference data"}</Badge>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-line bg-surface-2/60 px-4 py-3">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-ok" />
          <p className="text-[11px] leading-relaxed text-ink-soft">
            These are <span className="font-medium text-ink">probabilistic suggestions, not admissions decisions</span>. Nothing here accounts for your finances,
            family obligations, health, campus politics or the advice of a person who knows you. Treat it as a well-organised second opinion and take it to a real
            adviser.
          </p>
        </div>
      </Card>

      {/* ------------------------------------------------------------ toc */}
      <nav aria-label="Report sections" className="no-print sticky top-16 z-30 -mx-4 border-y border-line bg-surface/85 px-4 py-2 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <ol className="flex items-center gap-1 overflow-x-auto sm:gap-1.5">
          {SECTIONS.map((s, i) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={active === s.id ? "true" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] whitespace-nowrap transition-colors",
                  active === s.id ? "bg-surface-3 font-medium text-ink" : "text-ink-soft hover:bg-surface-2 hover:text-ink",
                )}
              >
                <span className="font-mono text-[10px] text-ink-faint">{i + 1}</span>
                {s.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* ============================ 1. STUDENT PROFILE SUMMARY ========== */}
      <section id="profile-summary" className="scroll-mt-32">
        <SectionHeading index="1" title="Student Profile Summary" subtitle="What this analysis is working from." />
        <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-4">
            <Card glass className="print-block p-5">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <Stat label="GPA" value={gpa(report.studentProfile.gpa)} sub={`out of ${report.studentProfile.scaleMax.toFixed(1)}`} />
                <Stat label="Credits" value={report.studentProfile.credits.toFixed(0)} sub="graded" />
                <Stat label="Scored" value={report.poolSize.toFixed(0)} sub="departments" />
                <Stat label="Confidence" value={lead?.confidence ?? "—"} sub="in the underlying evidence" />
              </div>
            </Card>

            <Card glass className="print-block p-5">
              <h4 className="mb-2.5 text-xs font-medium tracking-wide text-ink-soft uppercase">Your strongest interest axes</h4>
              {report.studentProfile.topInterests.length > 0 ? (
                <div className="space-y-2">
                  {report.studentProfile.topInterests.map((i) => (
                    <div key={i.key} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 truncate text-xs text-ink-soft">{axisLabel(i.key)}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                        <motion.div
                          className="h-full rounded-full bg-linear-to-r from-cyan-accent to-violet-accent"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(2, i.value)}%` }}
                          transition={{ duration: 0.6 }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right font-mono text-[11px] text-ink tabular-nums">{Math.round(i.value)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-ink-faint">No interest axis scored above zero.</p>
              )}
            </Card>

            {report.studentProfile.strengthSubjects.length > 0 ? (
              <Card glass className="print-block p-5">
                <h4 className="mb-2.5 text-xs font-medium tracking-wide text-ink-soft uppercase">Where your marks cluster</h4>
                <div className="space-y-2">
                  {report.studentProfile.strengthSubjects.map((s) => (
                    <div key={s.tag} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 truncate text-xs text-ink-soft capitalize">{s.tag.replace("-", " ")}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                        <motion.div
                          className={cn(
                            "h-full rounded-full",
                            s.average >= 3.4 ? "bg-linear-to-r from-ok to-cyan-accent" : s.average >= 2.5 ? "bg-linear-to-r from-brand-400 to-violet-accent" : "bg-linear-to-r from-warn to-risk",
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${(s.average / 4) * 100}%` }}
                          transition={{ duration: 0.6 }}
                        />
                      </div>
                      <span className="w-11 shrink-0 text-right font-mono text-[11px] text-ink tabular-nums">{s.average.toFixed(2)}</span>
                      <span className="w-10 shrink-0 text-right text-[10px] text-ink-faint">n={s.count}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            {report.studentProfile.dayInLife ? (
              <Card glass className="print-block p-5">
                <h4 className="mb-1.5 text-xs font-medium tracking-wide text-ink-soft uppercase">The day you described</h4>
                <p className="text-[13px] leading-relaxed text-ink-soft italic">“{report.studentProfile.dayInLife}”</p>
              </Card>
            ) : null}
          </div>

          <div className="space-y-4">
            <Card glass className="print-block p-5">
              <h4 className="mb-3 text-xs font-medium tracking-wide text-ink-soft uppercase">Target roles</h4>
              <div className="flex flex-wrap gap-1.5">
                {report.studentProfile.targetRoles.length > 0 ? (
                  report.studentProfile.targetRoles.map((id) => <Badge key={id} tone="brand">{getCareer(id)?.title ?? id}</Badge>)
                ) : (
                  <span className="text-[11px] text-ink-faint">None selected — career alignment scored neutrally.</span>
                )}
              </div>
              {report.studentProfile.workStyles.length > 0 ? (
                <>
                  <h4 className="mt-4 mb-2 text-xs font-medium tracking-wide text-ink-soft uppercase">Preferred environments</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {report.studentProfile.workStyles.map((w) => (
                      <Badge key={w} tone="violet">{w.replace(/-/g, " ")}</Badge>
                    ))}
                  </div>
                </>
              ) : null}
            </Card>

            <Card glass className="print-block p-5">
              <h4 className="mb-3 text-xs font-medium tracking-wide text-ink-soft uppercase">Your weighting</h4>
              {report.studentProfile.priorities.length > 0 ? (
                <div className="space-y-2">
                  {[...report.studentProfile.priorities]
                    .sort((a, b) => b.weight - a.weight)
                    .map((p) => (
                      <div key={p.id} className="flex items-center gap-2.5">
                        <span className="w-24 shrink-0 truncate text-[11px] text-ink-soft">{p.label}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                          <div className="h-full rounded-full bg-linear-to-r from-brand-400 to-violet-accent" style={{ width: `${p.weight}%` }} />
                        </div>
                        <span className="w-7 shrink-0 text-right font-mono text-[10px] text-ink-faint">{p.weight}</span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-[11px] text-ink-faint">No priorities weighted — every component fell back to its default.</p>
              )}
            </Card>
          </div>
        </div>
      </section>

      {/* ====================== 2. TOP 3 RECOMMENDATIONS ================== */}
      <section id="top-3" className="scroll-mt-32">
        <SectionHeading index="2" title="Top 3 Department Recommendations" subtitle="Ranked by weighted fit against your stated priorities." />
        {report.top3.length > 0 ? (
          <div className="space-y-5">
            {report.top3.map((d, i) => (
              <RankCard key={d.department.id} rank={i + 1} score={d} open={expanded.includes(d.department.id)} onToggle={() => toggle(d.department.id)} />
            ))}
          </div>
        ) : (
          <Card glass className="p-10 text-center">
            <Layers className="mx-auto size-7 text-ink-faint" />
            <h3 className="mt-3 font-display text-lg font-semibold text-ink">Nothing could be scored</h3>
            <p className="mx-auto mt-2 max-w-md text-[13px] text-ink-soft">
              No department had usable market data, so no ranking was produced. Check your connection and regenerate.
            </p>
          </Card>
        )}
      </section>

      {/* ========================== 3. RUNNERS-UP ========================= */}
      <section id="runners-up" className="scroll-mt-32">
        <SectionHeading
          index="3"
          title="Runners-up"
          subtitle={report.runnerUps.length > 0 ? "Ranks 4 and below. They lost on the weighted total, not on any single component." : "No further departments cleared the market-data threshold."}
        />
        {report.runnerUps.length > 0 ? (
          <Card glass className="print-block divide-y divide-line overflow-hidden">
            {report.runnerUps.map((r, i) => (
              <div key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-3.5">
                <span className="w-4 shrink-0 font-mono text-[11px] text-ink-faint tabular-nums">{i + 4}</span>
                <span className="min-w-0 flex-1 text-[13px] font-medium text-ink">{r.name}</span>
                <span className="font-mono text-xs font-semibold text-ink tabular-nums">{Math.round(r.total)}</span>
                <span className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-surface-3">
                  <span className="block h-full rounded-full bg-linear-to-r from-brand-400 to-violet-accent" style={{ width: `${Math.max(2, Math.min(100, r.total))}%` }} />
                </span>
                <span className="w-full text-[11px] leading-relaxed text-ink-soft sm:w-auto sm:flex-1 sm:text-right">{r.reason}</span>
              </div>
            ))}
          </Card>
        ) : (
          <Card glass className="p-6 text-[13px] text-ink-soft">Nothing else in the catalogue scored above the threshold.</Card>
        )}
      </section>

      {/* ================= 4. RISK ANALYSIS ================================ */}
      <section id="risks" className="scroll-mt-32">
        <SectionHeading index="4" title="Risk Analysis" subtitle="Where this advice is most likely to be wrong or incomplete." />
        <Card glass className="print-block p-5">
          <div className="mb-3.5 flex flex-wrap items-center gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <AlertTriangle className="size-4 text-warn" /> Risks
            </h3>
            <div className="no-print flex flex-wrap items-center gap-1.5">
              {(["high", "watch", "info"] as const).map((sev) => {
                const n = report.risks.filter((r) => r.severity === sev).length;
                return n > 0 ? (
                  <Badge key={sev} tone={SEVERITY_META[sev].tone}>
                    {n} {SEVERITY_META[sev].label.toLowerCase()}
                  </Badge>
                ) : null;
              })}
            </div>
          </div>
          {report.risks.length > 0 ? (
            <ul className="space-y-2.5">
              {report.risks.map((r, i) => {
                const meta = SEVERITY_META[r.severity];
                const Icon = meta.icon;
                return (
                  <li key={i} className={cn("print-block rounded-xl border p-3.5", meta.ring)}>
                    <div className="flex items-center gap-2">
                      <Icon className={cn("size-3.5 shrink-0", meta.iconClass)} />
                      <span className="text-[13px] font-medium text-ink">{r.title}</span>
                      <Badge tone={meta.tone} className="ml-auto shrink-0">{meta.label}</Badge>
                    </div>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-ink-soft">{r.detail}</p>
                    <p className="mt-1.5 border-t border-line/70 pt-1.5 text-[11px] leading-relaxed text-ink-faint">
                      <span className="font-medium text-ok">Mitigation:</span> {r.mitigation}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-[13px] text-ink-soft">No elevated risks detected in the data you provided.</p>
          )}
        </Card>
      </section>

      {/* ================= 5. BLIND SPOTS ================================== */}
      <section id="blind-spots" className="scroll-mt-32">
        <SectionHeading index="5" title="Blind Spots" subtitle="Things this tool structurally cannot see, and therefore did not score." />
        <Card glass className="print-block p-5">
          {report.blindSpots.length > 0 ? (
            <ol className="space-y-2.5">
              {report.blindSpots.map((b, i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl border border-line bg-surface-2/50 p-3.5">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-violet-accent/50 font-mono text-[10px] font-semibold text-violet-accent">
                    {i + 1}
                  </span>
                  <span className="text-[12px] leading-relaxed text-ink-soft">{b}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-[13px] text-ink-soft">No structural blind spots recorded.</p>
          )}
        </Card>
      </section>

      {/* ==================== 6. RECOMMENDED NEXT STEPS ================== */}
      <section id="next-steps" className="scroll-mt-32">
        <SectionHeading index="6" title="Recommended Next Steps" subtitle="Concrete, time-bound, and owned by someone." />
        <Card glass className="print-block p-5">
          {report.nextSteps.length > 0 ? (
            <ol className="space-y-3">
              {report.nextSteps.map((s, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex flex-col gap-3 rounded-xl border border-line bg-surface-2/50 p-4 sm:flex-row sm:items-start"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-500/15 font-display text-xs font-semibold text-brand-400">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] leading-relaxed font-medium text-ink">{s.action}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-ink-faint">
                      <span className="text-ink-soft">Why:</span> {s.why}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <span className="text-[11px] text-ink-soft">{s.when}</span>
                    <Badge tone="brand">{s.owner}</Badge>
                  </div>
                </motion.li>
              ))}
            </ol>
          ) : (
            <p className="text-[13px] text-ink-soft">No next steps could be generated from the current shortlist.</p>
          )}
        </Card>
      </section>

      {/* -------------------------------------------------------- method */}
      <Card glass className="print-block p-5">
        <h3 className="flex items-center gap-2 text-xs font-medium tracking-wide text-ink-soft uppercase">
          <Info className="size-3.5" /> How this was calculated
        </h3>
        <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">{report.methodNote}</p>
        <p className="mt-3 border-t border-line pt-3 font-mono text-[10px] text-ink-faint">report id {report.id}</p>
      </Card>
    </div>
  );
}

/* ============================================================== rank card */

function RankCard({ rank, score, open, onToggle }: { rank: number; score: DepartmentScore; open: boolean; onToggle: () => void }) {
  const d = score.department;
  const m = score.market.metrics;
  const f = score.feasibility;
  const req = d.requirements;
  const readiness = READINESS_META[f.status];

  const drivers = useMemo(() => {
    const ranked = [...score.components].sort((a, b) => b.value * b.weight - a.value * a.weight);
    return { best: ranked[0] as ScoreComponent | undefined, worst: ranked[ranked.length - 1] as ScoreComponent | undefined };
  }, [score.components]);

  const body = (
    <>
      <div className="flex flex-col gap-5 p-5 sm:flex-row">
        {/* rank + score */}
        <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-start">
          <span
            className="grid size-14 place-items-center rounded-2xl font-display text-2xl font-semibold"
            style={{ background: `oklch(0.7 0.15 ${d.hue} / 0.18)`, color: `oklch(0.64 0.18 ${d.hue})` }}
          >
            {rank}
          </span>
          <div className="sm:text-center">
            <div className="font-display text-3xl leading-none font-semibold text-ink tabular-nums">{Math.round(score.total)}</div>
            <div className="mt-1 text-[10px] tracking-widest text-ink-faint uppercase">/ 100</div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-semibold text-ink">{d.name}</h3>
            <Badge tone={BAND_TONE[score.band]}>{score.band}</Badge>
            <Badge tone="neutral">{score.confidence} confidence</Badge>
          </div>
          <p className="mt-1 text-[11px] text-ink-faint">
            {d.school} · {d.code} · {req.selectivity}-selectivity · {req.admissionMode === "capacity-capped" ? "capacity-capped entry" : `${req.admissionMode} entry`}
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{d.blurb}</p>

          {/* three required sub-sections, always visible in summary */}
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-surface-2/50 p-3.5">
              <h4 className="mb-1.5 text-[10px] font-semibold tracking-widest text-ink-faint uppercase">Why it fits</h4>
              <ul className="space-y-1.5">
                {score.strengths.slice(0, 3).map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] leading-relaxed text-ink-soft">
                    <CheckCircle2 className="mt-0.5 size-3 shrink-0 text-ok" />
                    {s}
                  </li>
                ))}
                {score.strengths.length === 0 ? <li className="text-[11px] text-ink-faint">No standout strengths in the current data.</li> : null}
              </ul>
            </div>

            <div className="rounded-xl border border-line bg-surface-2/50 p-3.5">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <h4 className="text-[10px] font-semibold tracking-widest text-ink-faint uppercase">Prerequisite health check</h4>
                <Badge tone={readiness.badge}>{readiness.label}</Badge>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={cn("font-display text-lg font-semibold tabular-nums", readiness.text)}>{f.readiness}</span>
                <span className="text-[10px] text-ink-faint">readiness /100</span>
              </div>
              <Progress value={f.readiness} tone={readiness.badge} className="mt-1.5" label={`${d.shortName} prerequisite readiness`} />
              <p className="mt-1.5 text-[11px] leading-relaxed text-ink-soft">
                {f.completedRequired}/{f.totalRequired} required courses cleared
                {f.meetsGpaGate ? ` · GPA gate ${f.requiredGpa.toFixed(2)} met` : ` · below the ${f.requiredGpa.toFixed(2)} GPA gate`}.
              </p>
              {f.missingHardGates.length > 0 ? (
                <p className="mt-1.5 text-[11px] leading-relaxed text-risk">
                  Unresolved hard gate{f.missingHardGates.length > 1 ? "s" : ""}: {f.missingHardGates.slice(0, 2).join(", ")}
                </p>
              ) : null}
            </div>

            <div className="rounded-xl border border-line bg-surface-2/50 p-3.5">
              <h4 className="mb-1.5 text-[10px] font-semibold tracking-widest text-ink-faint uppercase">Career outlook</h4>
              <div className="font-display text-lg leading-none font-semibold text-ink tabular-nums">{usd(m.medianSalary, { compact: true })}</div>
              <p className={cn("flex items-center gap-1 text-[11px] font-medium", m.projectedGrowth >= 0 ? "text-ok" : "text-risk")}>
                <TrendingUp className={cn("size-3", m.projectedGrowth < 0 && "scale-y-[-1]")} />
                {signedPct(m.projectedGrowth)} projected growth
              </p>
              <p className="mt-0.5 text-[11px] text-ink-soft">
                {pct(d.outcomes.gradSchoolRate)} continue to graduate study
              </p>
              <div className="mt-1.5">
                <SalaryBand p25={m.salaryP25} median={m.medianSalary} p75={m.salaryP75} hue={d.hue} />
              </div>
            </div>
          </div>

          {d.outcomes.licensureNote ? (
            <p className="mt-3 flex items-start gap-2 rounded-xl border border-warn/30 bg-warn/6 px-3.5 py-2.5 text-[11px] leading-relaxed text-ink-soft">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warn" />
              <span>
                <span className="font-medium text-warn">Licensure:</span> {d.outcomes.licensureNote}
              </span>
            </p>
          ) : null}

          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <FreshnessBadge snapshot={score.market} />
              <Badge tone={score.market.source === "live" ? "ok" : "warn"}>{score.market.source === "live" ? "Live BLS" : "Reference data"}</Badge>
              <span className="text-[11px] text-ink-faint">{d.careerIds.slice(0, 2).map((id) => getCareer(id)?.title ?? id).join(" · ")}</span>
            </div>
            <div className="no-print">
              <Button variant="ghost" size="sm" onClick={onToggle} aria-expanded={open} icon={<ArrowRight className={cn("size-3.5 transition-transform", open && "rotate-90")} />}>
                {open ? "Less" : "Full breakdown"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {open ? (
        <div className="border-t border-line bg-surface-2/40 p-5">
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div>
              <h4 className="mb-3 text-xs font-medium tracking-wide text-ink-soft uppercase">Score components</h4>
              <ScoreBars components={score.components} />
              <div className="mt-3 rounded-xl border border-line bg-surface-2/60 p-3.5">
                <h5 className="text-[10px] font-semibold tracking-widest text-ink-faint uppercase">What moved this score</h5>
                {drivers.best ? (
                  <p className="mt-1.5 text-[11px] leading-relaxed text-ink-soft">
                    <span className="font-medium text-ok">{drivers.best.label}</span> carried the most weight at {Math.round(drivers.best.weight * 100)}% of the
                    model and scored {Math.round(drivers.best.value)}/100.
                    {drivers.worst && drivers.worst.key !== drivers.best.key ? (
                      <>
                        {" "}
                        The drag was <span className="font-medium text-warn">{drivers.worst.label.toLowerCase()}</span> at {Math.round(drivers.worst.value)}/100.
                      </>
                    ) : null}
                  </p>
                ) : (
                  <p className="mt-1.5 text-[11px] text-ink-faint">No components contributed to this score.</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="mb-3 text-xs font-medium tracking-wide text-ink-soft uppercase">Market detail</h4>
              <MarketSummary snapshot={score.market} />

              <h4 className="mt-5 mb-2 text-xs font-medium tracking-wide text-ink-soft uppercase">Trade-offs</h4>
              {score.tradeoffs.length > 0 ? (
                <ul className="space-y-1.5">
                  {score.tradeoffs.map((t, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[12px] leading-relaxed text-ink-soft">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-warn" />
                      {t}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[12px] text-ink-faint">No material trade-offs surfaced.</p>
              )}

              {score.alsoConsider.length > 0 ? (
                <>
                  <h4 className="mt-4 mb-2 text-xs font-medium tracking-wide text-ink-soft uppercase">Also consider</h4>
                  <ul className="space-y-1.5">
                    {score.alsoConsider.map((a) => (
                      <li key={a.id} className="text-[12px] leading-relaxed text-ink-soft">
                        <span className="font-medium text-ink">{a.name}</span>{" "}
                        <span className="font-mono text-[11px] text-ink-faint">({Math.round(a.total)}/100)</span> — {a.reason}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          </div>

          <div className="mt-5">
            <h4 className="mb-3 text-xs font-medium tracking-wide text-ink-soft uppercase">Roadmap</h4>
            <ol className="grid gap-3 sm:grid-cols-3">
              {score.roadmap.map((r, i) => (
                <li key={i} className="rounded-xl border border-line bg-surface-2/60 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold tracking-widest text-brand-400 uppercase">{r.phase}</span>
                    <span className="text-[10px] text-ink-faint">{r.horizon}</span>
                  </div>
                  <p className="mt-1.5 text-[12px] font-medium text-ink">{r.goal}</p>
                  <ul className="mt-1.5 space-y-1">
                    {r.actions.map((a, ai) => (
                      <li key={ai} className="text-[11px] leading-relaxed text-ink-soft">
                        · {a}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 border-t border-line pt-2 text-[10px] text-ink-faint">Proof: {r.proof}</p>
                </li>
              ))}
            </ol>
          </div>

          <ProvenanceNote snapshot={score.market} className="mt-4" />
        </div>
      ) : null}
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="print-block"
    >
      <Card glass className="border-l-[3px]" style={{ borderLeftColor: `oklch(0.7 0.15 ${d.hue} / 0.55)` }}>
        {body}
      </Card>
    </motion.div>
  );
}

/* ----------------------------------------------------------------- bits */

function SectionHeading({ index, title, subtitle }: { index: string; title: string; subtitle: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-500/15 font-mono text-sm font-semibold text-brand-400">{index}</span>
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
        <p className="text-[12px] text-ink-soft">{subtitle}</p>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/60 px-3.5 py-3">
      <div className="text-[10px] font-medium tracking-widest text-ink-faint uppercase">{label}</div>
      <div className="mt-1 font-display text-xl leading-none font-semibold text-ink tabular-nums">{value}</div>
      {sub ? <div className="mt-1 truncate text-[10px] text-ink-faint">{sub}</div> : null}
    </div>
  );
}

function axisLabel(key: string): string {
  return INTEREST_AXES.find((a) => a.key === key)?.label ?? key;
}

/* ------------------------------------------------------ markdown export */

function toMarkdown(r: RecommendationReport): string {
  const L: string[] = [];
  const p = r.studentProfile;

  L.push(`# Department Selection Report`);
  L.push("");
  L.push(`Generated ${new Date(r.generatedAt).toLocaleString()} · ${r.poolSize} departments scored · id \`${r.id}\``);
  L.push("");
  L.push("> These are probabilistic suggestions, not admissions decisions. Take this to a real adviser.");
  L.push("");

  L.push("## 1. Student profile");
  L.push("");
  L.push(`- **GPA:** ${gpa(p.gpa)} / ${p.scaleMax.toFixed(1)}`);
  L.push(`- **Credits graded:** ${p.credits.toFixed(0)}`);
  L.push(`- **Confidence:** ${r.top3[0]?.confidence ?? "—"}`);
  L.push(`- **Target roles:** ${p.targetRoles.length > 0 ? p.targetRoles.join(", ") : "none stated"}`);
  L.push(`- **Preferred environments:** ${p.workStyles.length > 0 ? p.workStyles.map((w) => w.replace(/-/g, " ")).join(", ") : "none stated"}`);
  L.push("");
  if (p.topInterests.length > 0) {
    L.push(`**Strongest interest axes:** ${p.topInterests.map((i) => `${axisLabel(i.key)} ${Math.round(i.value)}`).join(" · ")}`);
    L.push("");
  }
  if (p.priorities.length > 0) {
    L.push("**Priority weighting**");
    L.push("");
    for (const w of [...p.priorities].sort((a, b) => b.weight - a.weight)) L.push(`- ${w.label}: ${w.weight}/100`);
    L.push("");
  }

  L.push("## 2. Ranked shortlist");
  L.push("");
  r.top3.forEach((s, i) => {
    const m = s.market.metrics;
    L.push(`### ${i + 1}. ${s.department.name} — ${Math.round(s.total)}/100 (${s.band}, ${s.confidence})`);
    L.push("");
    L.push(`${s.department.tagline}`);
    L.push("");
    L.push(`- School: ${s.department.school} (${s.department.code})`);
    L.push(`- Entry: ${s.department.requirements.selectivity}-selectivity, ${s.department.requirements.admissionMode}`);
    L.push(`- Prerequisites: ${s.feasibility.readiness}/100 (${s.feasibility.status}) · ${s.feasibility.completedRequired}/${s.feasibility.totalRequired} cleared · GPA gate ${s.feasibility.requiredGpa.toFixed(2)} ${s.feasibility.meetsGpaGate ? "met" : "not met"}`);
    L.push(`- Market: ${usd(m.medianSalary)} median (${usd(m.salaryP25)}–${usd(m.salaryP75)}), ${signedPct(m.projectedGrowth)} 10-yr growth, ${m.automationExposure}% automation exposure, ${pct(m.placementRate)} placement est. — ${s.market.source}`);
    L.push(`- ${pct(s.department.outcomes.gradSchoolRate)} continue to graduate study`);
    if (s.department.outcomes.licensureNote) L.push(`- Licensure: ${s.department.outcomes.licensureNote}`);
    L.push("");
    if (s.strengths.length > 0) {
      L.push("**Strengths**");
      for (const x of s.strengths) L.push(`- ${x}`);
      L.push("");
    }
    if (s.tradeoffs.length > 0) {
      L.push("**Trade-offs**");
      for (const x of s.tradeoffs) L.push(`- ${x}`);
      L.push("");
    }
    L.push("**Score components**");
    for (const c of s.components) L.push(`- ${c.label}: ${Math.round(c.value)}/100 (weight ${Math.round(c.weight * 100)}%) — ${c.rationale}`);
    L.push("");
    if (s.alsoConsider.length > 0) {
      L.push("**Also consider**");
      for (const a of s.alsoConsider) L.push(`- ${a.name} (${Math.round(a.total)}/100) — ${a.reason}`);
      L.push("");
    }
    for (const rp of s.roadmap) {
      L.push(`**${rp.phase} — ${rp.horizon}: ${rp.goal}**`);
      for (const x of rp.actions) L.push(`- ${x}`);
      L.push(`- Proof: ${rp.proof}`);
      L.push("");
    }
  });

  if (r.runnerUps.length > 0) {
    L.push("## 3. Runners-up");
    L.push("");
    r.runnerUps.forEach((u, i) => L.push(`${i + 4}. **${u.name}** — ${Math.round(u.total)}/100 · ${u.reason}`));
    L.push("");
  }

  L.push("## 4. Risks");
  L.push("");
  for (const risk of r.risks) {
    L.push(`### [${SEVERITY_META[risk.severity].label}] ${risk.title}`);
    L.push("");
    L.push(risk.detail);
    L.push("");
    L.push(`**Mitigation:** ${risk.mitigation}`);
    L.push("");
  }

  L.push("## 5. Blind spots");
  L.push("");
  r.blindSpots.forEach((b, i) => {
    L.push(`${i + 1}. ${b}`);
    L.push("");
  });

  L.push("## 6. Next steps");
  L.push("");
  r.nextSteps.forEach((s, i) => {
    L.push(`${i + 1}. **${s.action}**`);
    L.push(`   - Owner: ${s.owner} · When: ${s.when}`);
    L.push(`   - Why: ${s.why}`);
    L.push("");
  });

  L.push("## Method");
  L.push("");
  L.push(r.methodNote);
  L.push("");

  return L.join("\n");
}