import type { InterestVector, WorkStyle } from "@/lib/types";
import { INTEREST_AXES } from "@/lib/types";
import { QUIZ } from "@/lib/data/quiz";

/** Raw questionnaire state: questionId -> selected option ids. */
export type QuizAnswers = Record<string, string[]>;

/**
 * Convert questionnaire answers into an InterestVector.
 *
 * Axes accumulate as raw sums, then we normalise against the theoretical maximum
 * a student could have achieved per axis. Normalising per-axis (rather than
 * globally) keeps a student who answered "Biology" and "Chemistry" from being
 * outranked by someone who scattered one point across everything.
 */
export function deriveInterests(answers: QuizAnswers): InterestVector {
  const raw = {} as Record<keyof InterestVector, number>;
  const max = {} as Record<keyof InterestVector, number>;
  for (const axis of INTEREST_AXES) {
    raw[axis.key] = 0;
    max[axis.key] = 0;
  }

  for (const question of QUIZ) {
    const selected = answers[question.id] ?? [];
    for (const option of question.options) {
      // A single-choice question can award at most its option's contribution.
      const available = maxContributionFor(question, option.id, option.axis);
      for (const [key, delta] of Object.entries(option.axis)) {
        const k = key as keyof InterestVector;
        max[k] += available;
        if (selected.includes(option.id)) raw[k] += delta;
      }
    }
  }

  const out = {} as InterestVector;
  for (const axis of INTEREST_AXES) {
    const ceiling = max[axis.key];
    out[axis.key] = ceiling > 0 ? Math.round(Math.min(100, (raw[axis.key] / ceiling) * 100)) : 0;
  }
  return out;
}

/**
 * For single-choice questions only the selected option can fire, so the
 * theoretical maximum for that question is the largest single option's delta.
 */
function maxContributionFor(question: (typeof QUIZ)[number], optionId: string, axis: Partial<InterestVector>): number {
  if (question.kind === "multi") return 1;
  const own = Object.values(axis)[0] ?? 0;
  const best = Math.max(
    ...question.options.map((o) => Math.max(0, ...Object.values(o.axis))) as number[],
    0,
  );
  return own > 0 ? Math.min(1, own / best) : 1;
}

/** Optionality is inferred from how many multi-selects the student maximised. */
export function deriveOptionalityBias(answers: QuizAnswers): number {
  const multi = QUIZ.filter((q) => q.kind === "multi");
  if (multi.length === 0) return 50;
  const ratios = multi.map((q) => (answers[q.id]?.length ?? 0) / q.options.length);
  const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length;
  return Math.round(avg * 100);
}

export function deriveWorkloadTolerance(answers: QuizAnswers): number {
  const q5 = answers["q5-tolerances"] ?? [];
  let score = 50;
  for (const id of q5) {
    const opt = QUIZ.find((q) => q.id === "q5-tolerances")?.options.find((o) => o.id === id);
    if (opt?.weight) score += opt.weight;
  }
  return Math.max(0, Math.min(100, score));
}

export function deriveGradSchoolAppetite(answers: QuizAnswers): number {
  const q2 = answers["q2-environment"]?.[0];
  const q7 = answers["q7-horizon"]?.[0];
  let score = 35;
  const find = (qid: string, oid?: string) => QUIZ.find((q) => q.id === qid)?.options.find((o) => o.id === oid);
  for (const opt of [find("q2-environment", q2), find("q7-horizon", q7)]) {
    if (opt?.gradSchool) score += opt.gradSchool;
  }
  for (const id of answers["q5-tolerances"] ?? []) {
    const opt = find("q5-tolerances", id);
    if (opt?.gradSchool) score += opt.gradSchool;
  }
  return Math.max(0, Math.min(100, score));
}

const WORK_STYLE_FROM_ANSWER: Record<string, WorkStyle> = {
  "q2a": "research",
  "q2b": "corporate",
  "q2c": "startup",
  "q2d": "creative-studio",
  "q2e": "public-service",
};

export function suggestWorkStyles(answers: QuizAnswers): WorkStyle[] {
  const picked = WORK_STYLE_FROM_ANSWER[answers["q2-environment"]?.[0] ?? ""];
  const styles: WorkStyle[] = picked ? [picked] : [];
  // q6 frustration patterns are a second, independent signal.
  if ((answers["q6-signal"] ?? []).includes("q6c")) styles.push("fieldwork");
  if ((answers["q6-signal"] ?? []).includes("q6f")) styles.push("clinical");
  if ((answers["q6-signal"] ?? []).includes("q6a")) styles.push("startup");
  return [...new Set(styles)];
}

/** Which declared roles the quiz signal points toward. */
export function suggestTargetRoles(answers: QuizAnswers, catalogue: { id: string; axis: InterestVector }[]): string[] {
  const student = deriveInterests(answers);

  // Cosine similarity against each role's axis profile. Ranking by the sum of
  // the role's own axis magnitudes would return an identical list for every
  // student, which tells us nothing about who asked.
  const scored = catalogue.map((c) => {
    const dot = (Object.keys(student) as (keyof InterestVector)[]).reduce((sum, k) => sum + student[k] * (c.axis[k] ?? 0), 0);
    const mag = Math.sqrt((Object.keys(student) as (keyof InterestVector)[]).reduce((s, k) => s + student[k] ** 2, 0));
    const roleMag = Math.sqrt((Object.keys(c.axis) as (keyof InterestVector)[]).reduce((s, k) => s + (c.axis[k] ?? 0) ** 2, 0));
    const similarity = mag > 0 && roleMag > 0 ? dot / (mag * roleMag) : 0;
    return { id: c.id, similarity };
  });

  return [...scored]
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 6)
    .map((r) => r.id);
}

/**
 * Multi-select questions have no right answer, but some combinations are
 * internally inconsistent. Flagging these keeps the report honest instead of
 * quietly averaging over a contradiction.
 */
export function findAnswerContradictions(answers: QuizAnswers): string[] {
  const contradictions: string[] = [];
  const t = answers["q5-tolerances"] ?? [];
  if (t.includes("q5a") && t.includes("q5b") && t.includes("q5g")) {
    contradictions.push(
      "You selected heavy lab load, proof-heavy difficulty, and a genuine five-year research path together. That is a coherent but demanding combination — the reports below weight research intensity heavily, so check whether the ranked list still reflects what you want.",
    );
  }
  if (t.includes("q5f") && t.includes("q5g")) {
    contradictions.push(
      "You want to start earning sooner and also want a five-year research path. These pull in opposite directions; rankings will treat this as a genuine trade-off rather than resolving it for you.",
    );
  }
  const c = answers["q6-signal"] ?? [];
  if (c.includes("q6d") && c.includes("q6a")) {
    contradictions.push(
      "You find lab work tedious but are pulled toward majors defined by building physical things. Several results below are laboratory-intensive — read the workload section before you commit.",
    );
  }
  return contradictions;
}