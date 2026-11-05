"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { AlertTriangle, CheckCircle2, ChevronDown, CircleDashed, Clock, Flag, Loader2 } from "lucide-react";
import { Badge, Card, Progress } from "@/components/ui/primitives";
import { useAdvisor, useAspiration } from "@/lib/store";
import { rankPreliminary } from "@/lib/preliminary";
import { getDepartment } from "@/lib/data/departments";
import type { PrereqStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUS_META: Record<PrereqStatus["status"], { icon: typeof CheckCircle2; tone: "ok" | "warn" | "risk" | "neutral"; label: string }> = {
  completed: { icon: CheckCircle2, tone: "ok", label: "Cleared" },
  "in-progress": { icon: Clock, tone: "warn", label: "In progress" },
  "below-min": { icon: AlertTriangle, tone: "risk", label: "Below minimum" },
  "not-started": { icon: CircleDashed, tone: "neutral", label: "Not started" },
  waived: { icon: CheckCircle2, tone: "ok", label: "Waived" },
};

export function PhaseFeasibility() {
  const { transcript, interests } = useAdvisor();
  const aspiration = useAspiration();
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = useMemo(
    () => rankPreliminary({ transcript, interests, aspiration, limit: 8 }),
    [transcript, interests, aspiration],
  );

  return (
    <div className="space-y-6">
      <Card glass className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="font-display text-xl font-semibold text-ink">Prerequisite audit</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              These departments are ranked on academic fit, interest and prerequisites only. No pay figures or market data have been consulted yet, so you can see how
              your record stands before any financial signal enters the picture.
            </p>
          </div>
          <Badge tone="neutral">{rows.length} of 20 departments shown</Badge>
        </div>
        {transcript.courses.length === 0 ? (
          <p className="mt-4 rounded-xl border border-warn/35 bg-warn/6 px-4 py-3 text-[13px] text-ink-soft">
            You have not entered any courses, so every prerequisite below reads as &ldquo;not started&rdquo;. Go back to Phase 1 to add your record — the audit is
            far more useful with real grades in it.
          </p>
        ) : null}
      </Card>

      <div className="grid gap-4">
        {rows.map((row, i) => {
          const f = row.feasibility;
          const d = getDepartment(f.departmentId);
          if (!d) return null;
          const open = expanded === d.id;
          const statusTone = f.status === "clear" ? "ok" : f.status === "workable" ? "brand" : f.status === "at-risk" ? "warn" : "risk";
          const statusLabel = f.status === "clear" ? "Clear to enter" : f.status === "workable" ? "Workable" : f.status === "at-risk" ? "At risk" : "Blocked";

          return (
            <motion.div key={d.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.4 }}>
              <Card glass className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : d.id)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-surface-2/40"
                >
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-xl font-display text-lg font-semibold"
                    style={{ background: `oklch(0.7 0.15 ${d.hue} / 0.16)`, color: `oklch(0.62 0.17 ${d.hue})` }}
                  >
                    {d.shortName.slice(0, 3)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-base font-semibold text-ink">{d.name}</h3>
                      <Badge tone={statusTone as "ok" | "warn" | "risk" | "brand"}>{statusLabel}</Badge>
                      {!f.meetsGpaGate ? <Badge tone="risk">GPA gate unmet</Badge> : null}
                      <Badge tone="neutral" mono>
                        {f.completedRequired}/{f.totalRequired} req
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-soft">
                      <span>
                        Readiness <strong className="font-mono text-ink">{f.readiness}/100</strong>
                      </span>
                      <span>
                        GPA gate <strong className="font-mono text-ink">{f.requiredGpa.toFixed(2)}</strong>
                      </span>
                      <span>
                        Entry <strong className="text-ink">{d.requirements.admissionMode}</strong>
                      </span>
                      {f.inProgress > 0 ? (
                        <span className="text-warn">
                          {f.inProgress} in progress
                        </span>
                      ) : null}
                      {f.belowMin > 0 ? <span className="text-risk">{f.belowMin} below minimum</span> : null}
                    </div>
                    <Progress value={f.readiness} tone={statusTone === "ok" ? "ok" : statusTone === "risk" ? "risk" : "brand"} className="mt-2.5 max-w-sm" />
                  </div>

                  <div className="hidden shrink-0 gap-6 text-right sm:flex">
                    <Mini label="Interest" value={row.interest} />
                    <Mini label="Academic" value={row.academic} />
                    <Mini label="Career" value={row.career} />
                    <div>
                      <div className="font-display text-xl leading-none font-semibold text-ink tabular-nums">{row.score}</div>
                      <div className="mt-1 text-[10px] tracking-widest text-ink-faint uppercase">prelim</div>
                    </div>
                  </div>

                  <ChevronDown className={cn("size-4 shrink-0 text-ink-faint transition-transform", open && "rotate-180")} />
                </button>

                {open ? (
                  <div className="border-t border-line bg-surface-2/40 p-5">
                    <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
                      <div>
                        <h4 className="mb-2.5 flex items-center gap-2 text-xs font-medium tracking-wide text-ink-soft uppercase">
                          <Flag className="size-3.5" /> Required course status
                        </h4>
                        <ul className="divide-y divide-line/60 overflow-hidden rounded-xl border border-line">
                          {f.prereqs.map((p) => (
                            <PrereqRow key={p.code} prereq={p} />
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="mb-2 text-xs font-medium tracking-wide text-ink-soft uppercase">Entry conditions</h4>
                          <dl className="space-y-1.5 text-[11px]">
                            <Row label="Cumulative GPA" value={`${f.requiredGpa.toFixed(2)} required`} ok={f.meetsGpaGate} />
                            <Row label="Your GPA" value={f.studentGpa.toFixed(2)} ok={f.meetsGpaGate} />
                            <Row label="Selectivity" value={d.requirements.selectivity} />
                            <Row label="Late declaration" value={d.requirements.acceptsLateDeclaration ? "Accepted" : "Restricted"} ok={d.requirements.acceptsLateDeclaration} />
                            <Row label="Total credits to degree" value={`${d.requirements.requiredCredits}`} />
                            <Row label="Still needed" value={`${f.projectedCreditsNeeded.toFixed(0)} credits`} />
                          </dl>
                        </div>

                        {f.missingHardGates.length > 0 ? (
                          <div className="rounded-xl border border-risk/35 bg-risk/6 p-3.5">
                            <h4 className="flex items-center gap-1.5 text-[11px] font-semibold text-risk uppercase">
                              <AlertTriangle className="size-3.5" /> Unresolved hard gates
                            </h4>
                            <ul className="mt-2 space-y-1 font-mono text-[11px] text-ink-soft">
                              {f.missingHardGates.map((g) => (
                                <li key={g}>· {g}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}

                        {f.notes.length > 0 ? (
                          <div className="rounded-xl border border-line bg-surface-3/50 p-3.5">
                            <h4 className="mb-2 text-[11px] font-semibold tracking-wide text-ink uppercase">Notes</h4>
                            <ul className="space-y-2 text-[11px] leading-relaxed text-ink-soft">
                              {f.notes.map((n, ni) => (
                                <li key={ni}>{n}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}
              </Card>
            </motion.div>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <Card glass className="p-8 text-center">
          <Loader2 className="mx-auto size-6 animate-spin text-ink-faint" />
          <p className="mt-3 text-sm text-ink-soft">Running prerequisite audit…</p>
        </Card>
      ) : null}
    </div>
  );
}

/* ----------------------------------------------------------------------- */

function PrereqRow({ prereq }: { prereq: PrereqStatus }) {
  const meta = STATUS_META[prereq.status];
  const Icon = meta.icon;
  return (
    <li className="flex items-start gap-3 bg-surface-2/40 px-3.5 py-2.5">
      <Icon
        className={cn(
          "mt-0.5 size-4 shrink-0",
          prereq.status === "completed" ? "text-ok" : prereq.status === "in-progress" ? "text-warn" : prereq.status === "below-min" ? "text-risk" : "text-ink-faint",
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-mono text-xs text-ink">{prereq.code}</span>
          <span className="truncate text-[11px] text-ink-soft">{prereq.title}</span>
          {prereq.hardGate ? (
            <Badge tone="risk" className="shrink-0">
              hard gate
            </Badge>
          ) : null}
        </div>
        <p className="mt-0.5 text-[11px] leading-relaxed text-ink-faint">{prereq.note}</p>
      </div>
      <div className="shrink-0 text-right">
        {prereq.grade !== null ? (
          <span className={cn("font-mono text-xs font-semibold tabular-nums", prereq.status === "completed" ? "text-ok" : "text-risk")}>{prereq.grade.toFixed(1)}</span>
        ) : (
          <span className="font-mono text-[11px] text-ink-faint">—</span>
        )}
        <div className="mt-0.5 text-[10px] text-ink-faint">min {prereq.minGrade?.toFixed(1) ?? "—"}</div>
      </div>
    </li>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-display text-xl leading-none font-semibold text-ink tabular-nums">{Math.round(value)}</div>
      <div className="mt-1 text-[10px] tracking-widest text-ink-faint uppercase">{label}</div>
    </div>
  );
}

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink-faint">{label}</dt>
      <dd className={cn("text-right font-medium", ok === true ? "text-ok" : ok === false ? "text-risk" : "text-ink")}>{value}</dd>
    </div>
  );
}