"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Briefcase, Check, HeartHandshake, Search, SlidersHorizontal, TriangleAlert } from "lucide-react";
import { Badge, Card, CardHeader, Input, Slider, Textarea } from "@/components/ui/primitives";
import { InterestBars } from "@/components/viz/charts";
import { InterestRadar } from "@/components/viz/charts";
import { useAdvisor } from "@/lib/store";
import { QUIZ, WORK_STYLE_OPTIONS } from "@/lib/data/quiz";
import { CAREERS, getCareer, WORK_STYLE_LABEL } from "@/lib/data/careers";
import { findAnswerContradictions } from "@/lib/interests";
import { INTEREST_AXES, type WorkStyle } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PhaseAspiration() {
  const {
    answers,
    interests,
    setAnswer,
    setAnswers,
    targetRoles,
    setTargetRoles,
    workStyles,
    setWorkStyles,
    environment,
    setEnvironment,
    workloadTolerance,
    setWorkloadTolerance,
    optionalityBias,
    setOptionalityBias,
    gradSchoolAppetite,
    setGradSchoolAppetite,
    priorities,
    setPriority,
    dayInLife,
    setDayInLife,
    checkDistress,
  } = useAdvisor();

  const [roleQuery, setRoleQuery] = useState("");
  const [openRoleList, setOpenRoleList] = useState(false);

  const answered = QUIZ.filter((q) => (answers[q.id]?.length ?? 0) > 0).length;
  const contradictions = useMemo(() => findAnswerContradictions(answers), [answers]);

  const filteredRoles = useMemo(() => {
    const q = roleQuery.trim().toLowerCase();
    const pool = q ? CAREERS.filter((c) => c.title.toLowerCase().includes(q) || c.blurb.toLowerCase().includes(q)) : CAREERS;
    return pool.slice(0, 8);
  }, [roleQuery]);

  const toggleRole = (id: string) => {
    setTargetRoles(targetRoles.includes(id) ? targetRoles.filter((r) => r !== id) : [...targetRoles, id].slice(0, 5));
  };

  const toggleStyle = (id: WorkStyle) => {
    setWorkStyles(workStyles.includes(id) ? workStyles.filter((s) => s !== id) : [...workStyles, id].slice(0, 4));
  };

  const chooseOption = (questionId: string, optionId: string, kind: string, current: string[]) => {
    if (kind === "multi") {
      const next = current.includes(optionId) ? current.filter((o) => o !== optionId) : [...current, optionId];
      setAnswers(questionId, next);
    } else {
      setAnswer(questionId, optionId);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-5">
        {/* ------------------------------------------------ questionnaire */}
        <Card glass>
          <CardHeader
            title="Working style and instincts"
            subtitle="Six questions. There are no wrong answers and no perfect profile — contradictions are surfaced, not averaged away."
            action={
              <Badge tone={answered === QUIZ.length ? "ok" : "neutral"}>
                {answered}/{QUIZ.length} answered
              </Badge>
            }
          />
          <div className="space-y-6 p-5 pt-0">
            {QUIZ.map((q, qi) => {
              const selected = answers[q.id] ?? [];
              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: qi * 0.05, duration: 0.4 }}
                  className="border-t border-line/70 pt-5 first:border-0 first:pt-0"
                >
                  <div className="mb-1 flex items-start gap-2.5">
                    <span className="mt-0.5 font-mono text-[10px] text-ink-faint">Q{qi + 1}</span>
                    <div>
                      <h4 className="text-sm leading-snug font-medium text-ink">{q.prompt}</h4>
                      {q.helper ? <p className="mt-1 text-[11px] text-ink-faint">{q.helper}</p> : null}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {q.options.map((opt) => {
                      const active = selected.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => chooseOption(q.id, opt.id, q.kind, selected)}
                          aria-pressed={active}
                          className={cn(
                            "group relative rounded-xl border px-3.5 py-2.5 text-left text-[13px] transition-all",
                            active
                              ? "border-brand-500/70 bg-brand-500/10 text-ink shadow-sm"
                              : "border-line bg-surface-2/60 text-ink-soft hover:border-brand-400/50 hover:bg-surface-2 hover:text-ink",
                          )}
                        >
                          <span className="flex items-start gap-2">
                            <span
                              className={cn(
                                "mt-0.5 grid size-4 shrink-0 place-items-center border transition-colors",
                                q.kind === "multi" ? "rounded" : "rounded-full",
                                active ? "border-brand-500 bg-brand-500 text-white" : "border-line",
                              )}
                            >
                              {active ? <Check className="size-2.5" strokeWidth={3.5} /> : null}
                            </span>
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>

        {contradictions.length > 0 ? (
          <Card className="border-warn/35 bg-warn/6 p-5">
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warn" />
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-ink">Tension in your answers</h4>
                {contradictions.map((c, i) => (
                  <p key={i} className="text-[12px] leading-relaxed text-ink-soft">
                    {c}
                  </p>
                ))}
              </div>
            </div>
          </Card>
        ) : null}

        {/* ----------------------------------------------------- priorities */}
        <Card glass>
          <CardHeader title="What you are optimising for" subtitle="These directly reweight the score. Drag anything you care about upward." action={<SlidersHorizontal className="size-4 text-ink-faint" />} />
          <div className="space-y-5 p-5 pt-0">
            {priorities.map((p) => (
              <Slider key={p.id} label={p.label} value={p.weight} onChange={(v) => setPriority(p.id, v)} leftHint="not important" rightHint="decisive" />
            ))}
            <div className="grid gap-5 border-t border-line/70 pt-5 sm:grid-cols-3">
              <Slider label="Workload appetite" value={workloadTolerance} onChange={setWorkloadTolerance} leftHint="spare capacity" rightHint="want it hard" tone="warn" />
              <Slider label="Keep options open" value={optionalityBias} onChange={setOptionalityBias} leftHint="commit now" rightHint="keep bridges open" tone="ok" />
              <Slider label="Graduate study appetite" value={gradSchoolAppetite} onChange={setGradSchoolAppetite} leftHint="stop at bachelor's" rightHint="want a doctorate" />
            </div>
          </div>
        </Card>

        {/* ---------------------------------------------------- target roles */}
        <Card glass>
          <CardHeader
            title="Target roles"
            subtitle="Strongly recommended. Career alignment is the component this changes most."
            action={<Badge tone={targetRoles.length ? "ok" : "warn"}>{targetRoles.length} selected</Badge>}
          />
          <div className="space-y-3 p-5 pt-0">
            {targetRoles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {targetRoles.map((id) => {
                  const role = getCareer(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleRole(id)}
                      className="group inline-flex items-center gap-1.5 rounded-full border border-brand-500/40 bg-brand-500/10 px-3 py-1 text-xs text-ink transition-colors hover:border-risk/50 hover:bg-risk/10"
                    >
                      {role?.title ?? id}
                      <span className="text-ink-faint group-hover:text-risk">×</span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            <div className="relative">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint" />
                <Input value={roleQuery} onChange={(e) => setRoleQuery(e.target.value)} onFocus={() => setOpenRoleList(true)} placeholder="Search occupations…" className="pl-9" />
              </div>
              {openRoleList ? (
                <ul className="absolute inset-x-0 z-20 mt-1 max-h-64 overflow-y-auto rounded-xl border border-line bg-surface-2/98 p-1 shadow-2xl backdrop-blur-xl">
                  {filteredRoles.map((role) => {
                    const active = targetRoles.includes(role.id);
                    return (
                      <li key={role.id}>
                        <button
                          type="button"
                          onClick={() => {
                            toggleRole(role.id);
                            setRoleQuery("");
                          }}
                          className="flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-surface-3"
                        >
                          <span className={cn("mt-0.5 grid size-4 shrink-0 place-items-center rounded border", active ? "border-brand-500 bg-brand-500 text-white" : "border-line")}>
                            {active ? <Check className="size-2.5" strokeWidth={3.5} /> : null}
                          </span>
                          <span className="min-w-0">
                            <span className="flex items-center gap-2">
                              <span className="truncate text-[13px] text-ink">{role.title}</span>
                              {role.degreeLevel !== "bachelor" ? (
                                <Badge tone="violet" className="shrink-0">
                                  {role.degreeLevel === "doctorate" ? "PhD" : role.degreeLevel === "master" ? "MS" : role.degreeLevel === "professional" ? "professional" : "MS/PhD"}
                                </Badge>
                              ) : null}
                            </span>
                            <span className="mt-0.5 block truncate text-[11px] text-ink-faint">{role.blurb}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                  {filteredRoles.length === 0 ? <li className="px-3 py-3 text-xs text-ink-faint">No occupations match that search.</li> : null}
                </ul>
              ) : null}
            </div>
          </div>
        </Card>

        {/* ------------------------------------------------- work styles etc */}
        <Card glass>
          <CardHeader title="Environment and day-to-day" subtitle="Used to test whether the work fits, not just the subject." />
          <div className="space-y-5 p-5 pt-0">
            <div>
              <p className="mb-2.5 text-xs font-medium tracking-wide text-ink-soft uppercase">Working environments you would choose</p>
              <div className="flex flex-wrap gap-2">
                {WORK_STYLE_OPTIONS.map((w) => {
                  const active = workStyles.includes(w.id);
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => toggleStyle(w.id)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-left text-xs transition-all",
                        active ? "border-violet-accent/60 bg-violet-accent/12 text-ink" : "border-line bg-surface-2/60 text-ink-soft hover:border-violet-accent/40 hover:text-ink",
                      )}
                    >
                      <span className="block font-medium">{w.label}</span>
                      <span className="mt-0.5 block text-[10px] text-ink-faint">{w.blurb}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-2.5 text-xs font-medium tracking-wide text-ink-soft uppercase">Organisation type</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["large-corporate", "Large corporate"],
                    ["small-team", "Small team"],
                    ["startup", "Startup"],
                    ["nonprofit", "Nonprofit"],
                    ["government", "Government"],
                    ["self-employed", "Independent"],
                    ["undecided", "Genuinely undecided"],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setEnvironment(v)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition-colors",
                      environment === v ? "border-brand-500 bg-brand-500/12 text-ink" : "border-line text-ink-soft hover:border-brand-400/50 hover:text-ink",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium tracking-wide text-ink-soft uppercase">Describe an ideal working day</p>
                <HeartHandshake className="size-4 text-ink-faint" />
              </div>
              <Textarea
                value={dayInLife}
                onChange={(e) => {
                  setDayInLife(e.target.value);
                  // Guardrail: watch free text for acute distress and pause if fired.
                  checkDistress(e.target.value);
                }}
                rows={4}
                placeholder="A sentence or two about what your Tuesday actually looks like. If you are overwhelmed or want to talk to someone, this box will point you to campus support immediately — it does not judge."
              />
              <p className="mt-2 text-[11px] text-ink-faint">
                Read for fit, not for writing quality. Nothing here is sent anywhere.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* ------------------------------------------------------- sidebar */}
      <div className="space-y-5 lg:sticky lg:top-20 lg:self-start">
        <Card glass>
          <CardHeader title="Live profile" subtitle="Recomputed on every answer." action={<Briefcase className="size-4 text-ink-faint" />} />
          <div className="space-y-5 p-5 pt-0">
            <InterestRadar interests={interests} departmentTags={[]} hue={265} />
            <InterestBars interests={interests} />
            <div className="grid grid-cols-3 gap-2 border-t border-line/70 pt-4 text-center">
              <MiniStat label="Workload" value={workloadTolerance} />
              <MiniStat label="Optionality" value={optionalityBias} />
              <MiniStat label="Grad study" value={gradSchoolAppetite} />
            </div>
          </div>
        </Card>

        {workStyles.length > 0 ? (
          <Card glass className="p-5">
            <h4 className="mb-2.5 text-xs font-medium tracking-wide text-ink-soft uppercase">Selected environments</h4>
            <div className="flex flex-wrap gap-1.5">
              {workStyles.map((s) => (
                <Badge key={s} tone="violet">
                  {WORK_STYLE_LABEL[s] ?? s}
                </Badge>
              ))}
            </div>
          </Card>
        ) : null}

        <Card glass className="p-5">
          <h4 className="mb-2.5 text-xs font-medium tracking-wide text-ink-soft uppercase">How the eight axes are read</h4>
          <ul className="space-y-2.5">
            {INTEREST_AXES.map((a) => (
              <li key={a.key} className="text-[11px] leading-relaxed">
                <span className="font-medium text-ink">{a.label}</span>
                <span className="block text-ink-faint">{a.blurb}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[10px] leading-relaxed text-ink-faint">
            Axes that tend to oppose each other are listed in the method page. Scoring does not average contradictions away — it reports them.
          </p>
        </Card>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="font-display text-xl leading-none font-semibold text-ink tabular-nums">{value}</div>
      <div className="mt-1 text-[10px] leading-tight text-ink-faint">{label}</div>
    </div>
  );
}