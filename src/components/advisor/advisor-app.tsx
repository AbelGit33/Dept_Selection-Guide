"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, HeartHandshake, Lock, RefreshCw, RotateCcw, Sparkles, TriangleAlert, X } from "lucide-react";
import { Badge, Button, Spinner } from "@/components/ui/primitives";
import { PhaseProfile } from "@/components/advisor/phase-profile";
import { PhaseAspiration } from "@/components/advisor/phase-aspiration";
import { PhaseFeasibility } from "@/components/advisor/phase-feasibility";
import { PhaseMarket } from "@/components/advisor/phase-market";
import { ReportView } from "@/components/results/report-view";
import { useAdvisor } from "@/lib/store";
import { runAnalysis } from "@/lib/analysis";
import { PHASES, type DistressSignal, type MarketSnapshot, type Phase } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AdvisorApp() {
  const phase = useAdvisor((s) => s.phase);
  const maxPhaseReached = useAdvisor((s) => s.maxPhaseReached);
  const courses = useAdvisor((s) => s.courses);
  const targetRoles = useAdvisor((s) => s.targetRoles);
  const workStyles = useAdvisor((s) => s.workStyles);
  const answered = useAdvisor((s) => Object.keys(s.answers).length);
  const distress = useAdvisor((s) => s.distress);
  const distressAcknowledged = useAdvisor((s) => s.distressAcknowledged);
  const report = useAdvisor((s) => s.report);
  const reportLoading = useAdvisor((s) => s.reportLoading);
  const setPhase = useAdvisor((s) => s.setPhase);
  const acknowledgeDistress = useAdvisor((s) => s.acknowledgeDistress);
  const reset = useAdvisor((s) => s.reset);
  const setReport = useAdvisor((s) => s.setReport);
  const setReportLoading = useAdvisor((s) => s.setReportLoading);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Report generation depends on a network round trip; failing silently left
  // the student on Phase 4 with a button that appeared to do nothing.
  const [reportError, setReportError] = useState<string | null>(null);

  const canAdvance = useMemo(() => {
    switch (phase) {
      case 1:
        return courses.length > 0;
      case 2:
        return answered > 0 && (targetRoles.length > 0 || workStyles.length > 0);
      case 3:
      case 4:
        return true;
      default:
        return false;
    }
  }, [phase, courses.length, answered, targetRoles.length, workStyles.length]);

  const advance = () => {
    if (phase < 5) setPhase((phase + 1) as Phase);
  };
  const back = () => {
    if (phase > 1) setPhase((phase - 1) as Phase);
  };

  const generateReport = async () => {
    const state = useAdvisor.getState();
    setReportError(null);
    setReportLoading(true);
    try {
      // Market snapshots come from our own API (no student data leaves the
      // device); the scoring and analysis itself run locally below.
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 180_000);
      const res = await fetch("/api/market", { signal: controller.signal }).finally(() => clearTimeout(timer));
      const json = (await res.json()) as {
        ok: boolean;
        departments?: (MarketSnapshot & { id: string })[];
        error?: string;
      };
      if (!json.ok || !json.departments) throw new Error(json.error ?? "Market data unavailable");

      const snapshots = new Map<string, MarketSnapshot>();
      for (const d of json.departments) {
        const { id: departmentId, ...snapshot } = d;
        snapshots.set(departmentId, snapshot as MarketSnapshot);
      }

      const built = runAnalysis({
        transcript: state.transcript,
        interests: state.interests,
        aspiration: {
          targetRoles: state.targetRoles,
          workStyles: state.workStyles,
          environment: state.environment,
          workloadTolerance: state.workloadTolerance,
          optionalityBias: state.optionalityBias,
          gradSchoolAppetite: state.gradSchoolAppetite,
          dayInLife: state.dayInLife,
          priorities: state.priorities,
        },
        markets: snapshots,
      });
      setReport(built);
      setReportLoading(false);
      setPhase(5);
    } catch (e) {
      setReportLoading(false);
      setReportError(
        e instanceof DOMException && e.name === "AbortError"
          ? "The market service took too long to answer. Nothing you entered was lost — try again in a moment."
          : e instanceof Error && e.message
            ? e.message
            : "The recommendation could not be built. Everything you entered is still on this device — try again.",
      );
    }
  };

  if (!mounted) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <AnimatePresence>{distress.detected && !distressAcknowledged ? <DistressBanner signal={distress} onAcknowledge={acknowledgeDistress} /> : null}</AnimatePresence>

      <PhaseRail phase={phase} maxPhaseReached={maxPhaseReached} onJump={setPhase} />

      <main className="mt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            {phase === 1 ? <PhaseProfile /> : null}
            {phase === 2 ? <PhaseAspiration /> : null}
            {phase === 3 ? <PhaseFeasibility /> : null}
            {phase === 4 ? <PhaseMarket /> : null}
            {phase === 5 ? <ReportView report={report} onRegenerate={generateReport} loading={reportLoading} /> : null}
          </motion.div>
        </AnimatePresence>
      </main>

      {reportError ? (
        <div className="no-print mt-8 flex items-start gap-3 rounded-2xl border border-risk/35 bg-risk/6 px-4 py-3.5" role="alert">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-risk" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink">Recommendation not built</p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-ink-soft">{reportError}</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={generateReport}
            disabled={reportLoading}
            icon={reportLoading ? <Spinner className="size-3.5" /> : <RefreshCw className="size-3.5" />}
          >
            Try again
          </Button>
        </div>
      ) : null}

      {phase < 5 ? (
        <div className="no-print sticky bottom-0 z-30 mt-8 border-t border-line bg-surface/85 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <Button variant="ghost" onClick={back} disabled={phase === 1} icon={<ArrowLeft className="size-4" />}>
              Back
            </Button>

            <div className="hidden items-center gap-1.5 text-[11px] text-ink-faint sm:flex">
              <Lock className="size-3" />
              Stored on this device only
            </div>

            {phase === 4 ? (
              <Button onClick={generateReport} disabled={reportLoading || distress.detected} icon={reportLoading ? <Spinner className="size-4" /> : <Sparkles className="size-4" />}>
                {reportLoading ? "Building report…" : "Generate recommendation"}
              </Button>
            ) : (
              <Button onClick={advance} disabled={!canAdvance || distress.detected} icon={<ArrowRight className="size-4" />}>
                Continue
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="no-print mt-8 flex justify-center">
          <Button variant="ghost" onClick={reset} icon={<RotateCcw className="size-4" />}>
            Start over
          </Button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ rail */

function PhaseRail({ phase, maxPhaseReached, onJump }: { phase: Phase; maxPhaseReached: Phase; onJump: (p: Phase) => void }) {
  return (
<div className="no-print relative">
        <div className="mb-2 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">{PHASES.find((p) => p.id === phase)?.title}</h1>
        <Badge tone="neutral">
          Phase {phase} of 5
        </Badge>
      </div>
      <p className="mb-6 text-sm text-ink-soft">{PHASES.find((p) => p.id === phase)?.blurb}</p>

      <ol className="flex items-center gap-1.5 sm:gap-3">
        {PHASES.map((p) => {
          const done = p.id < phase;
          const current = p.id === phase;
          const reachable = p.id <= maxPhaseReached;
          return (
            <li key={p.id} className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-3">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => onJump(p.id)}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "flex min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 transition-colors",
                  reachable ? "cursor-pointer" : "cursor-not-allowed opacity-40",
                  current && "bg-surface-2",
                )}
              >
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold transition-colors",
                    done && "bg-ok text-white",
                    current && "bg-brand-500 text-white",
                    !done && !current && "border border-line text-ink-faint",
                  )}
                >
                  {done ? <Check className="size-3" strokeWidth={3} /> : p.id}
                </span>
                <span className={cn("hidden truncate text-xs sm:block", current ? "font-medium text-ink" : "text-ink-soft")}>{p.label}</span>
              </button>
              {p.id < 5 ? <div className={cn("h-px flex-1", done ? "bg-ok/50" : "bg-line")} /> : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* -------------------------------------------------------------- distress */

function DistressBanner({ signal, onAcknowledge }: { signal: DistressSignal; onAcknowledge: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="mb-6 overflow-hidden rounded-2xl border border-ok/35 bg-ok/8"
      role="alertdialog"
      aria-label="Support resources"
    >
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
        <HeartHandshake className="size-6 shrink-0 text-ok" />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold text-ink">Pause here — you deserve real support</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            What you wrote suggests you may be carrying more than a course decision. This tool cannot help with that, and choosing a department is not the answer
            to how you are feeling. These are free and confidential.
          </p>

          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {signal.resources.map((r) => (
              <li key={r.label} className="rounded-xl border border-line bg-surface-2/70 p-3.5">
                <div className="text-sm font-medium text-ink">{r.label}</div>
                <div className="mt-0.5 text-[12px] leading-relaxed text-ink-soft">{r.detail}</div>
              </li>
            ))}
          </ul>

          <p className="mt-3 text-[11px] text-ink-faint">
            Nothing you typed was saved to any server, and no one at this institution is notified.
          </p>
        </div>

        <Button variant="secondary" onClick={onAcknowledge} icon={<X className="size-4" />}>
          I&rsquo;m okay, continue
        </Button>
      </div>
    </motion.div>
  );
}
