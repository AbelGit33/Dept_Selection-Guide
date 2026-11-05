"use client";

import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ClipboardPaste, GraduationCap, Lock, Plus, Sparkles, Trash2, Wand2 } from "lucide-react";
import { Badge, Button, Card, CardHeader, Input, Select, Textarea } from "@/components/ui/primitives";
import { InterestBars } from "@/components/viz/charts";
import { useAdvisor } from "@/lib/store";
import { inferSubject, parseGrade, parseTranscriptText, pointToLetter, subjectStrengths } from "@/lib/transcript";
import { SUBJECT_TAGS, type SubjectTag } from "@/lib/types";
import { cn, gpa as fmtGpa, id } from "@/lib/utils";

export function PhaseProfile() {
  const {
    transcriptText,
    courses,
    transcript,
    interests,
    setTranscriptText,
    setCourses,
    addCourse,
    updateCourse,
    removeCourse,
    loadSampleTranscript,
  } = useAdvisor();

  const [mode, setMode] = useState<"paste" | "manual">(courses.length > 0 ? "manual" : "paste");
  const [draft, setDraft] = useState({ code: "", title: "", credits: "3", grade: "", subject: "other" as SubjectTag });
  const parsePreview = useMemo(() => (transcriptText.trim() ? parseTranscriptText(transcriptText) : []), [transcriptText]);

  const strengths = useMemo(() => subjectStrengths(courses), [courses]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleParse = () => setCourses(parsePreview);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setTranscriptText(text);
      setCourses(parseTranscriptText(text));
      setMode("manual");
    };
    reader.readAsText(file);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      {/* ------------------------------------------------------ input */}
      <div className="space-y-5">
        <Card glass>
          <CardHeader
            title="Academic record"
            subtitle="Paste from your student portal, upload a file, or add courses by hand."
            action={
              <div className="flex rounded-lg border border-line p-0.5">
                {(["paste", "manual"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs transition-colors",
                      mode === m ? "bg-brand-500 text-white" : "text-ink-soft hover:text-ink",
                    )}
                  >
                    {m === "paste" ? "Paste" : "Courses"}
                  </button>
                ))}
              </div>
            }
          />

          <div className="space-y-4 p-5 pt-0">
            <AnimatePresence mode="wait">
              {mode === "paste" ? (
                <motion.div key="paste" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
                  <Textarea
                    value={transcriptText}
                    onChange={(e) => setTranscriptText(e.target.value)}
                    rows={9}
                    placeholder={`One course per line. Separators like commas, pipes or dashes all work.\n\nMATH 140 Calculus I, 4, A\nMATH 141 Calculus II, 4, B+\nCS 201 Data Structures & Algorithms | 4 | B\nPHYS 201 University Physics I, 4, IP`}
                    className="font-mono text-[13px]"
                    spellCheck={false}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={handleParse} disabled={parsePreview.length === 0} icon={<Wand2 className="size-4" />}>
                      Parse {parsePreview.length > 0 ? `${parsePreview.length} courses` : ""}
                    </Button>
                    <Button variant="ghost" onClick={loadSampleTranscript} icon={<Sparkles className="size-4" />}>
                      Load example
                    </Button>
                    <Button variant="ghost" onClick={() => fileRef.current?.click()} icon={<ClipboardPaste className="size-4" />}>
                      Upload file
                    </Button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".txt,.csv,text/plain"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f);
                      }}
                    />
                  </div>

                  {parsePreview.length > 0 ? (
                    <div className="rounded-xl border border-line bg-surface-2/60 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-ink">Parsed preview</span>
                        <span className="text-[11px] text-ink-faint">
                          {parsePreview.filter((c) => c.grade !== null).length} graded ·{" "}
                          {parsePreview.reduce((s, c) => s + c.credits, 0).toFixed(0)} credits
                        </span>
                      </div>
                      <ul className="grid max-h-48 gap-1 overflow-y-auto pr-1 sm:grid-cols-2">
                        {parsePreview.map((c) => (
                          <li key={c.id} className="flex items-center justify-between gap-2 rounded-md bg-surface/60 px-2 py-1 text-[11px]">
                            <span className="truncate font-mono text-ink">{c.code}</span>
                            <span className="shrink-0 font-mono text-ink-faint">
                              {c.credits}cr · {c.grade === null ? "IP" : c.gradeLetter}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </motion.div>
              ) : (
                <motion.div key="manual" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    <Input placeholder="CS 201" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} className="col-span-2 sm:col-span-1" />
                    <Input placeholder="Course title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="col-span-2 sm:col-span-2" />
                    <Input placeholder="3" type="number" min={0.5} step={0.5} value={draft.credits} onChange={(e) => setDraft({ ...draft, credits: e.target.value })} />
                    <Select value={draft.grade} onChange={(e) => setDraft({ ...draft, grade: e.target.value })}>
                      <option value="">In progress</option>
                      {["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"].map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value as SubjectTag })} className="w-auto min-w-40">
                      {SUBJECT_TAGS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </Select>
                    <Button
                      variant="secondary"
                      icon={<Plus className="size-4" />}
                      onClick={() => {
                        const code = draft.code.trim().toUpperCase();
                        if (!code) return;
                        const grade = parseGrade(draft.grade) ?? null;
                        addCourse({
                          id: id(),
                          code,
                          title: draft.title.trim() || "Untitled course",
                          credits: Math.max(0.5, Math.min(20, Number(draft.credits) || 3)),
                          grade,
                          gradeLetter: grade === null ? null : pointToLetter(grade),
                          subject: draft.subject === "other" ? inferSubject(code, draft.title) : draft.subject,
                        });
                        setDraft({ code: "", title: "", credits: "3", grade: "", subject: "other" });
                      }}
                    >
                      Add course
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* privacy notice */}
            <div className="flex items-start gap-2.5 rounded-xl border border-ok/25 bg-ok/6 px-3.5 py-3">
              <Lock className="mt-0.5 size-4 shrink-0 text-ok" />
              <p className="text-[11px] leading-relaxed text-ink-soft">
                <span className="font-medium text-ink">Your record stays on this device.</span> Parsing, GPA maths and every prerequisite check run in your browser.
                No API request in this application has a field that could carry a grade, so there is nothing to transmit even accidentally.
              </p>
            </div>
          </div>
        </Card>

        {courses.length > 0 ? (
          <Card glass>
            <CardHeader
              title={`${courses.length} courses on record`}
              subtitle="Correct anything the parser got wrong — the scoring reads these values directly."
              action={
                <Button variant="ghost" size="sm" onClick={() => setCourses([])}>
                  Clear all
                </Button>
              }
            />
            <div className="max-h-96 overflow-y-auto px-5 pb-5">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 z-10 bg-surface/95 backdrop-blur-sm">
                  <tr className="text-[10px] tracking-widest text-ink-faint uppercase">
                    <th className="py-2 pr-2 font-medium">Code</th>
                    <th className="py-2 pr-2 font-medium">Title</th>
                    <th className="py-2 pr-2 font-medium">Cr</th>
                    <th className="py-2 pr-2 font-medium">Grade</th>
                    <th className="py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c.id} className="group border-t border-line/70">
                      <td className="py-1.5 pr-2">
                        <input
                          value={c.code}
                          onChange={(e) => updateCourse(c.id, { code: e.target.value.toUpperCase() })}
                          className="w-20 rounded-md bg-transparent px-1 py-0.5 font-mono text-xs text-ink outline-none focus:bg-surface-2"
                        />
                      </td>
                      <td className="py-1.5 pr-2">
                        <input
                          value={c.title}
                          onChange={(e) => updateCourse(c.id, { title: e.target.value })}
                          className="w-full rounded-md bg-transparent px-1 py-0.5 text-xs text-ink-soft outline-none focus:bg-surface-2"
                        />
                      </td>
                      <td className="py-1.5 pr-2">
                        <input
                          type="number"
                          value={c.credits}
                          onChange={(e) => updateCourse(c.id, { credits: Math.max(0.5, Number(e.target.value) || 0.5) })}
                          className="w-12 rounded-md bg-transparent px-1 py-0.5 font-mono text-xs text-ink outline-none focus:bg-surface-2"
                        />
                      </td>
                      <td className="py-1.5 pr-2">
                        <select
                          value={c.grade === null ? "ip" : (c.gradeLetter ?? "")}
                          onChange={(e) => {
                            const v = e.target.value;
                            const g = v === "ip" ? null : parseGrade(v);
                            updateCourse(c.id, { grade: g, gradeLetter: g === null ? null : pointToLetter(g) });
                          }}
                          className={cn(
                            "w-16 rounded-md bg-transparent px-1 py-0.5 font-mono text-xs outline-none focus:bg-surface-2",
                            c.grade === null ? "text-ink-faint" : c.grade >= 3 ? "text-ok" : c.grade >= 2 ? "text-ink" : "text-risk",
                          )}
                        >
                          <option value="ip">IP</option>
                          {["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"].map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-1.5 text-right">
                        <button
                          type="button"
                          onClick={() => removeCourse(c.id)}
                          aria-label={`Remove ${c.code}`}
                          className="rounded-md p-1 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100 hover:text-risk focus:opacity-100"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : null}
      </div>

      {/* ---------------------------------------------------- summary */}
      <div className="space-y-5 lg:sticky lg:top-20 lg:self-start">
        <Card glass>
          <CardHeader title="Record summary" subtitle="Credits-weighted, normalised to a 4.0 scale." />
          <div className="grid grid-cols-2 gap-2.5 p-5 pt-0">
            <Stat label="GPA" value={transcript.creditsAttempted ? fmtGpa(transcript.gpa) : "—"} tone={transcript.gpa >= 3.2 ? "ok" : transcript.gpa >= 2.5 ? "neutral" : "warn"} />
            <Stat label="Credits earned" value={transcript.creditsEarned.toFixed(1)} />
            <Stat label="Attempted" value={transcript.creditsAttempted.toFixed(1)} />
            <Stat label="At C or better" value={transcript.creditsStrong.toFixed(1)} tone="ok" />
            {transcript.currentTermCredits > 0 ? (
              <Stat label="In progress" value={`${transcript.currentTermCredits.toFixed(1)} cr`} />
            ) : null}
          </div>
        </Card>

        {strengths.length > 0 ? (
          <Card glass>
            <CardHeader
              title="Where your marks cluster"
              subtitle="Credit-weighted average by subject group."
              action={<GraduationCap className="size-4 text-ink-faint" />}
            />
            <div className="space-y-2 p-5 pt-0">
              {strengths.map((s) => (
                <div key={s.tag} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-xs text-ink-soft capitalize">{s.tag.replace("-", " ")}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                    <motion.div
                      className={cn("h-full rounded-full", s.average >= 3.4 ? "bg-linear-to-r from-ok to-cyan-accent" : s.average >= 2.5 ? "bg-linear-to-r from-brand-400 to-violet-accent" : "bg-linear-to-r from-warn to-risk")}
                      initial={{ width: 0 }}
                      animate={{ width: `${(s.average / 4) * 100}%` }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                  <span className="w-11 shrink-0 text-right font-mono text-[11px] text-ink tabular-nums">{s.average.toFixed(2)}</span>
                  <span className="w-12 shrink-0 text-right text-[10px] text-ink-faint">n={s.count}</span>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card glass className="p-5">
            <p className="text-sm text-ink-soft">
              No courses parsed yet. Add your record above, or load the example to see how the pipeline works end to end.
            </p>
          </Card>
        )}

        <Card glass className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-ink">Interest profile</h3>
            <Badge tone="neutral">from Phase 2</Badge>
          </div>
          <InterestBars interests={interests} />
          <p className="mt-3 text-[11px] leading-relaxed text-ink-faint">
            Computed from your questionnaire answers. Complete Phase 2 to populate it properly.
          </p>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "ok" | "warn" | "risk" }) {
  const tones = { neutral: "text-ink", ok: "text-ok", warn: "text-warn", risk: "text-risk" };
  return (
    <div className="rounded-xl border border-line bg-surface-2/60 px-3.5 py-3">
      <div className="text-[10px] font-medium tracking-widest text-ink-faint uppercase">{label}</div>
      <div className={cn("mt-1 font-display text-2xl leading-none font-semibold tabular-nums", tones[tone])}>{value}</div>
    </div>
  );
}