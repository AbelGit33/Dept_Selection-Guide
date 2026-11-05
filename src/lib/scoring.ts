import type {
  Aspiration,
  Confidence,
  CurriculumCourse,
  Department,
  DepartmentScore,
  FeasibilityReport,
  InterestVector,
  MarketSnapshot,
  PrereqStatus,
  ScoreComponent,
  Transcript,
} from "@/lib/types";
import { INTEREST_AXES } from "@/lib/types";
import { getCareer, rolesForDepartment } from "@/lib/data/careers";
import { matchCourse, subjectStrengths } from "@/lib/transcript";

/* ==================================================================== *
 * Phase 3 — Feasibility & Gap Analysis
 * ==================================================================== */

const DEFAULT_MIN_GRADE = 2.0;

export function assessFeasibility(department: Department, transcript: Transcript): FeasibilityReport {
  const notes: string[] = [];
  const prereqs: PrereqStatus[] = [];
  const missingHardGates: string[] = [];

  const requiredCourses = department.curriculum.filter((c) => c.required);

  for (const requirement of requiredCourses) {
    const minGrade = requirement.minGrade ?? DEFAULT_MIN_GRADE;
    let status: PrereqStatus["status"] = "not-started";
    let grade: number | null = null;
    let note = "Not on your record yet — take it within the major's normal sequence.";
    let matchedCourse = null as Transcript["courses"][number] | null;

    for (const taken of transcript.courses) {
      const m = matchCourse(taken, requirement.code);
      if (m.exact || m.partial) {
        matchedCourse = taken;
        break;
      }
    }

    if (matchedCourse) {
      grade = matchedCourse.grade;
      if (grade === null) {
        status = "in-progress";
        note = "Currently in progress — assume the department's declared policy applies.";
      } else if (grade >= minGrade) {
        status = "completed";
        note =
          grade >= 3.7
            ? "Strong result — comfortably clears the minimum."
            : "Completed above the minimum grade for this course.";
      } else {
        status = "below-min";
        note = `You have ${grade.toFixed(1)}; most departments require ${minGrade.toFixed(1)} or better and will expect a retake.`;
      }
      if (mismatchNote(matchedCourse, requirement)) note += mismatchNote(matchedCourse, requirement)!;
    }

    if (status === "below-min" && requirement.hardGate) {
      missingHardGates.push(requirement.code);
    }

    prereqs.push({
      code: requirement.code,
      title: requirement.title,
      category: requirement.category,
      credits: requirement.credits,
      status,
      grade,
      required: requirement.required,
      hardGate: Boolean(requirement.hardGate),
      minGrade,
      note,
    });
  }

  const meetsGpaGate = transcript.gpa >= department.requirements.overallGpa;
  if (!meetsGpaGate) {
    notes.push(
      `Your GPA of ${transcript.gpa.toFixed(2)} sits below the ${department.requirements.overallGpa.toFixed(2)} declaration threshold for this major. Most institutions allow a re-declaration route once the GPA recovers.`,
    );
    missingHardGates.push(`CUMULATIVE GPA ≥ ${department.requirements.overallGpa.toFixed(2)}`);
  }

  const completedRequired = prereqs.filter((p) => p.status === "completed").length;
  const inProgress = prereqs.filter((p) => p.status === "in-progress").length;
  const belowMin = prereqs.filter((p) => p.status === "below-min").length;
  const totalRequired = prereqs.length || 1;

  // Requirements count for more once you are deep into a degree, because the
  // sequencing flexibility a first-year student enjoys mostly disappears.
  const creditsProgress = Math.min(1, transcript.creditsAttempted / department.requirements.requiredCredits);
  const completionRatio = (completedRequired + inProgress * 0.55) / totalRequired;

  const gpaHeadroom = transcript.gpa - department.requirements.overallGpa;
  const gpaComponent = Math.max(
    0,
    Math.min(100, 55 + gpaHeadroom * 26 + (transcript.gpa >= department.requirements.overallGpa ? 12 : -20)),
  );

  const readiness = Math.round(
    gpaComponent * 0.3 + completionRatio * 100 * 0.45 + Math.min(100, (transcript.creditsStrong / department.requirements.requiredCredits) * 140) * 0.25,
  );

  const status: FeasibilityReport["status"] = !meetsGpaGate
    ? transcript.creditsAttempted > 0 && belowMin > 0
      ? "blocked"
      : "at-risk"
    : belowMin > 0 || (creditsProgress > 0.55 && completionRatio < 0.3)
      ? "at-risk"
      : completionRatio >= 0.75 || !department.requirements.acceptsLateDeclaration === false
        ? "clear"
        : "workable";

  const projectedCreditsNeeded = Math.max(
    0,
    Math.round((department.requirements.requiredCredits - transcript.creditsEarned) * 10) / 10,
  );

  if (!department.requirements.acceptsLateDeclaration) {
    notes.push(
      "This department normally restricts late declaration to students who have already declared. Check whether your institution grants an exception — some do, with a portfolio or coursework evidence.",
    );
  }
  if (department.requirements.admissionMode === "capacity-capped") {
    notes.push(
      "Entry to the major is capacity-capped. Being academically eligible is necessary but not sufficient — internal applicants are usually ranked on coursework performance.",
    );
  }
  if (department.requirements.selectivity === "very-high") {
    notes.push("Realistic expectation setting: this major has the most competitive internal entry of the catalogue.");
  }

  return {
    departmentId: department.id,
    readiness: Math.max(0, Math.min(100, readiness)),
    status,
    meetsGpaGate,
    requiredGpa: department.requirements.overallGpa,
    studentGpa: transcript.gpa,
    completedRequired,
    totalRequired,
    inProgress,
    belowMin,
    missingHardGates,
    projectedCreditsNeeded,
    prereqs,
    notes,
  };
}

function mismatchNote(taken: Transcript["courses"][number], requirement: CurriculumCourse): string | null {
  if (taken.code.toUpperCase().replace(/\s+/g, "") !== requirement.code.toUpperCase().replace(/\s+/g, "")) {
    return ` You listed this as "${taken.title}" — confirm your institution counts it as the equivalent course.`;
  }
  return null;
}

/* ==================================================================== *
 * Interest similarity
 * ==================================================================== */

export function departmentInterestVector(department: Department): InterestVector {
  const vector = {} as InterestVector;
  const tagged = new Set(department.interestTags);
  for (const axis of INTEREST_AXES) {
    vector[axis.key] = tagged.has(axis.key) ? 100 : 0;
  }
  return vector;
}

export function cosineSimilarity(a: InterestVector, b: InterestVector): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (const axis of INTEREST_AXES) {
    const av = a[axis.key] ?? 0;
    const bv = b[axis.key] ?? 0;
    dot += av * bv;
    magA += av * av;
    magB += bv * bv;
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/** Interests that run against this major — surfaced as a "blind spot" signal. */
export function conflictingAxes(student: InterestVector, department: Department): string[] {
  const opposites = new Map<keyof InterestVector, keyof InterestVector>();
  for (const axis of INTEREST_AXES) if (axis.opposedTo) opposites.set(axis.key, axis.opposedTo);

  const conflicts: string[] = [];
  for (const tag of department.interestTags) {
    const opposite = opposites.get(tag);
    if (!opposite) continue;
    if ((student[tag] ?? 0) >= 55 && (student[opposite] ?? 0) <= 35) {
      const axisLabel = INTEREST_AXES.find((a) => a.key === tag)?.label ?? tag;
      const oppLabel = INTEREST_AXES.find((a) => a.key === opposite)?.label ?? opposite;
      conflicts.push(`${axisLabel} without ${oppLabel}`);
    }
  }
  return conflicts;
}

/* ==================================================================== *
 * Component scores
 * ==================================================================== */

/** Curriculum category -> the transcript subject tags that feed it. */
const CATEGORY_SUBJECTS: Record<string, string[]> = {
  math: ["math"],
  computing: ["computing", "math"],
  engineering: ["engineering", "physical"],
  science: ["science", "math"],
  lab: ["science", "engineering", "health"],
  core: [],
  elective: [],
  capstone: [],
};

function academicFit(department: Department, transcript: Transcript): { value: number; rationale: string } {
  if (transcript.courses.length === 0) {
    return { value: 50, rationale: "No transcript supplied — scored at a neutral baseline." };
  }

  const strengths = subjectStrengths(transcript.courses);
  const byTag = new Map(strengths.map((s) => [s.tag, s]));

  const demandByTag = new Map<string, number>();
  for (const course of department.curriculum.filter((c) => c.required)) {
    const tags = CATEGORY_SUBJECTS[course.category] ?? [];
    const share = 1 / Math.max(1, tags.length);
    for (const t of tags) demandByTag.set(t, (demandByTag.get(t) ?? 0) + course.credits * share);
  }

  const totalDemand = [...demandByTag.values()].reduce((a, b) => a + b, 0);
  if (totalDemand === 0) {
    return {
      value: Math.min(100, transcript.gpa * 22),
      rationale: `Little coursework-weighted technical demand; scored mainly on your ${transcript.gpa.toFixed(2)} GPA.`,
    };
  }

  let weighted = 0;
  let covered = 0;
  const drivers: string[] = [];
  for (const [tag, demand] of demandByTag) {
    const s = byTag.get(tag as Transcript["courses"][number]["subject"]);
    if (s) {
      weighted += s.average * demand;
      covered += demand;
      if (s.average >= 3.5) drivers.push(`${tag.replace("-", " ")} (${s.average.toFixed(1)})`);
    }
  }

  const performance = covered > 0 ? weighted / covered : 2.4;
  const headroom = transcript.gpa - department.requirements.overallGpa;
  const value = Math.max(0, Math.min(100, performance * 21 + 12 + headroom * 12));

  const coveragePct = Math.round((covered / totalDemand) * 100);
  const rationale =
    covered === 0
      ? `Your record has no coursework in this major's core subjects yet, so the fit is estimated from GPA alone (${transcript.gpa.toFixed(2)}).`
      : `Performance across the courses this major weights most heavily is ${performance.toFixed(2)} average (${coveragePct}% of core demand covered by graded work)${
          drivers.length ? `, with strength in ${drivers.slice(0, 2).join(" and ")}` : ""
        }.`;

  return { value, rationale };
}

function careerAlignment(department: Department, aspiration: Aspiration): { value: number; rationale: string } {
  const roles = rolesForDepartment(department.careerIds);
  if (roles.length === 0) return { value: 50, rationale: "No role mapping available for this department." };

  const targets = aspiration.targetRoles;
  if (targets.length === 0) {
    return { value: 55, rationale: "No specific target role selected — scored as broadly compatible." };
  }

  const roleIds = new Set(roles.map((r) => r.id));
  const direct = targets.filter((t) => roleIds.has(t));
  // A target that shares a work style and a SOC family still counts, partially.
  const adjacent = targets.filter((t) => !roleIds.has(t));

  const directScore = direct.length / targets.length;
  let partialScore = 0;
  const partials: string[] = [];
  for (const t of adjacent) {
    const target = getCareer(t);
    if (!target) continue;
    const sharedSoc = target.soc.some((s) => roles.some((r) => r.soc.includes(s)));
    const sharedStyle = target.workStyles.some((w) => roles.some((r) => r.workStyles.includes(w)));
    if (sharedSoc || sharedStyle) {
      partialScore += sharedSoc ? 0.6 : 0.3;
      partials.push(target.title);
    }
  }
  partialScore = targets.length ? partialScore / targets.length : 0;

  const value = Math.round(Math.max(0, Math.min(100, (directScore * 0.78 + partialScore * 0.22) * 100)));

  const rationale = direct.length
    ? `${direct.length} of ${targets.length} of your target roles map directly onto this major's outcomes${partials.length ? `, plus ${partials.length} neighbouring role${partials.length > 1 ? "s" : ""} (${partials.slice(0, 2).join(", ")})` : ""}.`
    : partials.length
      ? `None of your target roles are primary exits for this major, but ${partials.slice(0, 2).join(" and ")} sit close enough to share entry requirements.`
      : `None of your target roles ${targets.slice(0, 2).join(" or ")} list this as an entry path.`;

  return { value, rationale };
}

function workStyleFit(department: Department, aspiration: Aspiration): { value: number; rationale: string } {
  const roles = rolesForDepartment(department.careerIds);
  if (aspiration.workStyles.length === 0) return { value: 60, rationale: "No work-style preference selected." };

  const supported = new Set(roles.flatMap((r) => r.workStyles));
  const hits = aspiration.workStyles.filter((w) => supported.has(w));
  const value = Math.round((hits.length / aspiration.workStyles.length) * 100);
  const rationale = hits.length
    ? `Your preferred ways of working (${aspiration.workStyles.length} selected) are supported by ${hits.length} of the roles this major feeds.`
    : `The roles this major feeds work mainly in ways you did not select.`;
  return { value, rationale };
}

function marketViability(snapshot: MarketSnapshot, aspiration: Aspiration): { value: number; rationale: string } {
  // Phase 3 previews score with a neutral market on purpose; say so explicitly
  // rather than letting placeholder figures look like real data.
  if (snapshot.seriesId === "not-yet-fetched") {
    return { value: 50, rationale: "Market data has not been fetched yet — this component is held neutral for now." };
  }
  const m = snapshot.metrics;
  // Growth: -10% -> 0, +40% -> 100.
  const growth = Math.max(0, Math.min(100, ((m.projectedGrowth + 10) / 50) * 100));
  // Salary: log scale between $35k and $220k.
  const salary = Math.max(0, Math.min(100, ((Math.log(Math.max(m.medianSalary, 30_000)) - Math.log(35_000)) / (Math.log(220_000) - Math.log(35_000))) * 100));
  const placement = Math.max(0, Math.min(100, m.placementRate * 100));
  const demand = Math.max(0, Math.min(100, m.demandIndex));

  const value = Math.round(demand * 0.3 + growth * 0.28 + salary * 0.24 + placement * 0.18);
  const rationale = `Demand index ${m.demandIndex}/100 on ~${formatCompact(m.sampleSize)} national jobs, ${m.projectedGrowth >= 0 ? "+" : ""}${m.projectedGrowth}% projected ten-year growth, $${Math.round(m.medianSalary / 1000)}k median, ${Math.round(m.placementRate * 100)}% placement estimate, ${m.automationExposure}% automation exposure.`;
  void aspiration;
  return { value, rationale };
}

function workloadFit(department: Department, aspiration: Aspiration): { value: number; rationale: string } {
  const w = department.workload;
  // Composite intensity, 1–5.
  const intensity = (w.mathIntensity * 1.3 + w.labIntensity * 1.2 + w.writingIntensity + w.groupWorkIntensity * 0.8) / 4.3;

  // Tolerance 0–100 maps to an expected intensity of 1.6 → 4.4.
  const expected = 1.6 + (aspiration.workloadTolerance / 100) * 2.8;
  const gap = intensity - expected;
  const value = Math.round(Math.max(0, Math.min(100, 70 - gap * 42)));
  const rationale =
    gap > 0.8
      ? `This major runs roughly ${gap.toFixed(1)} points heavier than the workload you told us you can sustain.`
      : gap < -0.8
        ? `This major is lighter than your stated appetite — you may find it under-challenging.`
        : `Workload intensity (math ${w.mathIntensity}/5, lab ${w.labIntensity}/5, writing ${w.writingIntensity}/5, group work ${w.groupWorkIntensity}/5) matches what you said you can sustain.`;
  return { value, rationale };
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

/* ==================================================================== *
 * Weighting — adapts to stated priorities
 * ==================================================================== */

export interface Weights {
  academic: number;
  interest: number;
  career: number;
  market: number;
  feasibility: number;
}

export function deriveWeights(aspiration: Aspiration): Weights {
  const p = (id: string) => aspiration.priorities.find((x) => x.id === id)?.weight ?? 50;
  const pay = p("pay");
  const stability = p("stability");
  const impact = p("impact");
  const interestP = p("interest");
  const advancement = p("advancement");

  const market = 0.16 + (pay / 100) * 0.14 + (stability / 100) * 0.08;
  let interest = 0.30 + (interestP / 100) * 0.12 - (pay / 100) * 0.06;
  const career = 0.18 + (advancement / 100) * 0.08;
  const academic = 0.22;
  const feasibility = 0.12 + aspiration.optionalityBias / 100 * 0.04;

  if (impact >= 78) {
    // Weight societal alignment directly rather than through market pay.
    interest += 0.04;
  }

  const total = market + interest + career + academic + feasibility;
  return {
    market: market / total,
    interest: interest / total,
    career: career / total,
    academic: academic / total,
    feasibility: feasibility / total,
  };
}

/* ==================================================================== *
 * Composite
 * ==================================================================== */

/**
 * Human-facing descriptions of the scoring components, surfaced on the method
 * page. Keyed to the `key` used in each `ScoreComponent`.
 */
export const WEIGHT_LABELS: Record<string, string> = {
  interest: "Interest alignment — cosine similarity between your eight-axis interest profile and the axes the department actually trains.",
  career: "Career alignment — how closely the department's destination roles overlap the roles you named in Phase 2.",
  academic: "Academic fit — credit-weighted performance in the subject areas the department leans on hardest.",
  market: "Market viability — median pay band, projected growth, demand index and automation exposure for its occupations.",
  feasibility: "Prerequisite readiness — how many required courses you have cleared, at or above their minimum grade, and whether you clear the GPA gate.",
  workload: "Workload fit — credits per term and course intensity measured against the workload appetite your answers implied.",
  style: "Work-style fit — whether the environments this field typically offers match the ones you selected.",
};

export function scoreDepartment(args: {
  department: Department;
  transcript: Transcript;
  interests: InterestVector;
  aspiration: Aspiration;
  market: MarketSnapshot;
  weights: Weights;
}): DepartmentScore {
  const { department, transcript, interests, aspiration, market, weights } = args;

  const feasibility = assessFeasibility(department, transcript);
  const academic = academicFit(department, transcript);
  const similarity = cosineSimilarity(interests, departmentInterestVector(department));
  const interestScore = Math.round(Math.max(0, Math.min(100, similarity * 100 * 1.06)));
  const interestRationale =
    similarity >= 0.5
      ? `Your strongest interest axes (${topInterestLabels(interests, 3).join(", ")}) line up well with what this major trains.`
      : `This major leans on ${department.interestTags.map(t => INTEREST_AXES.find((a) => a.key === t)?.short ?? t).join(" and ")}, which is only partly where your stated interests sit.`;

  const career = careerAlignment(department, aspiration);
  const style = workStyleFit(department, aspiration);
  const marketScore = marketViability(market, aspiration);
  const workload = workloadFit(department, aspiration);

  const components: ScoreComponent[] = [
    { key: "interest", label: "Interest alignment", value: interestScore, weight: weights.interest, rationale: interestRationale },
    { key: "career", label: "Career alignment", value: career.value, weight: weights.career * 0.68 + weights.market * 0.06, rationale: career.rationale },
    { key: "academic", label: "Academic fit", value: Math.round(academic.value), weight: weights.academic, rationale: academic.rationale },
    { key: "market", label: "Market viability", value: marketScore.value, weight: weights.market * 0.94, rationale: marketScore.rationale },
    { key: "feasibility", label: "Prerequisite readiness", value: feasibility.readiness, weight: weights.feasibility, rationale: readinessRationale(feasibility) },
    {
      key: "workload",
      label: "Workload fit",
      value: workload.value,
      weight: 0.07,
      rationale: workload.rationale,
    },
    {
      key: "style",
      label: "Work-style fit",
      value: style.value,
      weight: 0.05,
      rationale: style.rationale,
    },
  ];

  const weightSum = components.reduce((s, c) => s + c.weight, 0) || 1;
  const total = Math.round(components.reduce((sum, c) => sum + c.value * c.weight, 0) / weightSum);

  const band: DepartmentScore["band"] =
    total >= 78 ? "exceptional" : total >= 65 ? "strong" : total >= 50 ? "viable" : "speculative";

  const confidence = assessConfidence(transcript, aspiration, market, feasibility);

  return {
    department,
    total,
    band,
    confidence,
    components,
    feasibility,
    market,
    alsoConsider: [],
    strengths: deriveStrengths(department, components, feasibility, similarity),
    tradeoffs: deriveTradeoffs(department, components, feasibility, aspiration),
    roadmap: [],
  };
}

function readinessRationale(f: FeasibilityReport): string {
  if (f.totalRequired === 0) return "No published prerequisite structure to evaluate.";
  const pct = Math.round(((f.completedRequired + f.inProgress * 0.55) / f.totalRequired) * 100);
  return `${f.completedRequired} of ${f.totalRequired} required courses cleared${f.inProgress ? `, ${f.inProgress} in progress` : ""} (${pct}% of the required spine), readiness ${f.readiness}/100.`;
}

function topInterestLabels(interests: InterestVector, n: number): string[] {
  return [...INTEREST_AXES]
    .map((axis) => ({ label: axis.short, value: interests[axis.key] ?? 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n)
    .filter((x) => x.value > 0)
    .map((x) => x.label);
}

export function assessConfidence(
  transcript: Transcript,
  aspiration: Aspiration,
  market: MarketSnapshot,
  feasibility: FeasibilityReport,
): Confidence {
  let dataPoints = 0;
  if (transcript.courses.length >= 3) dataPoints += 2;
  else if (transcript.courses.length > 0) dataPoints += 1;
  if (aspiration.targetRoles.length > 0) dataPoints += 1;
  if (aspiration.workStyles.length > 0) dataPoints += 1;
  if (market.source === "live") dataPoints += 2;
  else if (market.source === "cached") dataPoints += 1;
  if (feasibility.totalRequired > 0) dataPoints += 1;

  if (dataPoints >= 6) return "high";
  if (dataPoints >= 4) return "moderate";
  if (dataPoints >= 2) return "emerging";
  return "insufficient";
}

function deriveStrengths(department: Department, components: ScoreComponent[], feasibility: FeasibilityReport, similarity: number): string[] {
  const byKey = new Map(components.map((c) => [c.key, c.value]));
  const out: string[] = [];

  if ((byKey.get("interest") ?? 0) >= 65) out.push(`Your stated interests map cleanly onto ${department.shortName}'s core material.`);
  if ((byKey.get("career") ?? 0) >= 65) out.push("Multiple of your target roles sit directly in this major's exit paths.");
  if ((byKey.get("academic") ?? 0) >= 65) out.push(`Your grades in the subject areas this major weights most heavily are already above the bar.`);
  if ((byKey.get("feasibility") ?? 0) >= 70) out.push(`${feasibility.completedRequired} of ${feasibility.totalRequired} prerequisite courses are already behind you.`);
  if (department.requirements.acceptsLateDeclaration) out.push("This department accepts late declaration, so a first-year decision is not a one-way door.");
  if (department.requirements.minorAvailable) out.push("A minor path exists, so you can combine this with a second discipline rather than choosing one identity.");
  if (department.workload.mathIntensity <= 3 && department.workload.labIntensity >= 3) out.push("Heavy laboratory time but comparatively light mathematics — the inverse of most science majors.");
  if (similarity > 0.7) out.push("This is a close match to your top interest cluster, which usually predicts persistence better than raw pay.");

  return out.slice(0, 5);
}

function deriveTradeoffs(
  department: Department,
  components: ScoreComponent[],
  feasibility: FeasibilityReport,
  aspiration: Aspiration,
): string[] {
  const byKey = new Map(components.map((c) => [c.key, c.value]));
  const out: string[] = [];

  if ((byKey.get("workload") ?? 100) < 55) out.push(`Workload intensity (${department.workload.creditsPerTerm} credits/term, lab ${department.workload.labIntensity}/5) sits above what you said you can sustain.`);
  if ((byKey.get("style") ?? 100) < 50) out.push("The working patterns in this field are a poor fit for the environments you preferred.");
  if (feasibility.status === "at-risk" || feasibility.status === "blocked") out.push(`Prerequisite position is ${feasibility.status} — ${feasibility.missingHardGates.length} hard gate(s) unresolved.`);
  if (department.outcomes.gradSchoolRequiredness >= 4) out.push(`Research careers in this field almost always require a graduate degree (${Math.round(department.outcomes.gradSchoolRate * 100)}% of graduates go on to one).`);
  if (aspiration.gradSchoolAppetite < 40 && department.outcomes.gradSchoolRequiredness >= 3) out.push("Your stated appetite for further study is lower than this field typically demands for its highest-paid roles.");
  if ((byKey.get("interest") ?? 100) < 55) out.push("Your interest signal does not strongly support this major — persistence is the main risk, not admission.");
  if (department.requirements.admissionMode === "capacity-capped") out.push("Capacity-capped entry means a strong transcript elsewhere may not be sufficient on its own.");
  if ((byKey.get("market") ?? 100) < 55) out.push("Market figures are mid-table: the payoff depends heavily on which specific role you end up in.");

  return out.slice(0, 5);
}

export { topInterestLabels, formatCompact };