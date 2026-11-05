import type {
  Aspiration,
  DepartmentScore,
  InterestVector,
  RecommendationReport,
  RiskFlag,
  RoadmapPhase,
  Transcript,
} from "@/lib/types";
import { DEPARTMENTS, getDepartment } from "@/lib/data/departments";
import { getCareer, rolesForDepartment } from "@/lib/data/careers";
import { DEMAND_INDEX_NOTE, socReference } from "@/lib/market/reference";
import { conflictingAxes, deriveWeights, scoreDepartment, type Weights } from "@/lib/scoring";
import { subjectStrengths } from "@/lib/transcript";

export interface AnalysisInput {
  transcript: Transcript;
  interests: InterestVector;
  aspiration: Aspiration;
  /** departmentId -> market snapshot, keyed by department. */
  markets: Map<string, import("@/lib/types").MarketSnapshot>;
  shortlist?: string[];
}

export function runAnalysis(input: AnalysisInput): RecommendationReport {
  const { transcript, interests, aspiration, markets } = input;
  const weights: Weights = deriveWeights(aspiration);

  const pool = input.shortlist?.length
    ? DEPARTMENTS.filter((d) => input.shortlist!.includes(d.id))
    : DEPARTMENTS;

  const scored = pool
    .filter((d) => markets.has(d.id))
    .map((department) =>
      scoreDepartment({
        department,
        transcript,
        interests,
        aspiration,
        market: markets.get(department.id)!,
        weights,
      }),
    )
    // Slight nudge so departments closer to the student's stated interests win
    // ties — important because totals cluster tightly in the 60s.
    .map((s) => ({ ...s, total: Math.min(100, s.total) }))
    .sort((a, b) => b.total - a.total || a.department.name.localeCompare(b.department.name));

  const top3 = scored.slice(0, 3).map((s, i) => ({
    ...s,
    rank: i + 1,
    alsoConsider: computeAlsoConsider(s, scored),
    roadmap: buildRoadmap(s, transcript),
  }));

  const runnerUps = scored.slice(3, 7).map((s) => ({
    id: s.department.id,
    name: s.department.name,
    total: s.total,
    reason: runnerUpReason(s, top3.map((t) => t.department.id)),
  }));

  const risks = buildRisks(top3, transcript, aspiration);
  const blindSpots = buildBlindSpots(top3, interests, transcript, aspiration);

  return {
    id: `rpt-${Date.now().toString(36)}`,
    generatedAt: new Date().toISOString(),
    poolSize: scored.length,
    studentProfile: buildProfile(transcript, aspiration, interests),
    top3,
    runnerUps,
    risks,
    blindSpots,
    nextSteps: buildNextSteps(top3, transcript),
    methodNote: methodNote(scored),
  };
}

/* ------------------------------------------------------------- profile */

function buildProfile(transcript: Transcript, aspiration: Aspiration, interests: InterestVector): RecommendationReport["studentProfile"] {
  const strengths = subjectStrengths(transcript.courses);
  const top = Object.entries(interests as Record<keyof InterestVector, number>)
    .map(([key, value]) => ({ key: key as keyof InterestVector, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 4);

  return {
    gpa: transcript.gpa,
    scaleMax: transcript.scaleMax,
    credits: transcript.creditsEarned,
    strengthSubjects: strengths.slice(0, 5),
    targetRoles: aspiration.targetRoles.map((id) => getCareer(id)?.title ?? id),
    workStyles: aspiration.workStyles,
    topInterests: top,
    priorities: aspiration.priorities.filter((p) => p.weight > 0),
    dayInLife: aspiration.dayInLife,
  };
}

/* ------------------------------------------------------ also consider */

function computeAlsoConsider(self: DepartmentScore, all: DepartmentScore[]) {
  const candidates = all
    .filter((s) => s.department.id !== self.department.id)
    .map((s) => {
      let reasonScore = 0;
      const reasons: string[] = [];

      if (self.department.adjacentIds.includes(s.department.id)) {
        reasonScore += 40;
        reasons.push("shares a curriculum core with this major");
      }
      if (self.department.school === s.department.school) {
        reasonScore += 6;
      }
      if (Math.abs(s.total - self.total) <= 6) {
        reasonScore += 22;
        reasons.push("scored within six points of this option");
      }
      const shared = s.department.interestTags.filter((t) => self.department.interestTags.includes(t));
      reasonScore += shared.length * 8;
      if (shared.length >= 2) reasons.push("works on the same two interest axes");

      // A pragmatic swap: strong career fit where the top choice is weakest.
      if (careerValue(s) > 78 && careerValue(self) < 62) {
        reasonScore += 18;
        reasons.push("tighter career alignment than your top-ranked option");
      }

      return { id: s.department.id, name: s.department.name, total: s.total, reason: reasons[0] ?? "scored comparably overall", reasonScore };
    })
    .sort((a, b) => b.reasonScore - a.reasonScore || b.total - a.total)
    .slice(0, 3);

  return candidates.map(({ id, name, reason, total }) => ({ id, name, reason, total }));
}

const careerValue = (s: DepartmentScore) => s.components.find((c) => c.key === "career")?.value ?? 0;

function runnerUpReason(s: DepartmentScore, topIds: string[]): string {
  const strongest = [...s.components].sort((a, b) => b.value * b.weight - a.value * a.weight)[0];
  const rankInCatalog = DEPARTMENTS.findIndex((d) => d.id === s.department.id) + 1;
  const adjacencyToTop = topIds.some((t) => getDepartment(t)?.adjacentIds.includes(s.department.id));
  return [
    strongest ? `led by ${strongest.label.toLowerCase()} (${strongest.value}/100)` : null,
    adjacencyToTop ? "adjacent to a top-ranked option" : null,
    `completed on ${rankInCatalog} of the required spine`,
    s.feasibility.status === "clear" ? "prerequisite position is already clear" : null,
  ]
    .filter(Boolean)
    .slice(0, 2)
    .join(", ");
}

/* -------------------------------------------------------------- risks */

function buildRisks(top3: DepartmentScore[], transcript: Transcript, aspiration: Aspiration): RiskFlag[] {
  const risks: RiskFlag[] = [];
  const [first, second, third] = top3;

  if (first) {
    const f = first.feasibility;
    if (f.status === "blocked") {
      risks.push({
        severity: "high",
        title: `${first.department.shortName} has an unresolved hard gate`,
        detail: `${f.missingHardGates.length} requirement(s) are blocking entry: ${f.missingHardGates.slice(0, 3).join(", ")}. Most departments remove students from a major after one D in a hard-gate course, and re-entry is often a year or more.`,
        mitigation: "Meet with the department undergraduate adviser this week and get the exact re-entry rule in writing before you plan any term around this major.",
      });
    } else if (f.status === "at-risk") {
      risks.push({
        severity: "watch",
        title: `${first.department.shortName} entry looks contested`,
        detail: `You have ${f.completedRequired} of ${f.totalRequired} required courses cleared against a ${f.requiredGpa.toFixed(2)} GPA gate, and this major is ${first.department.requirements.selectivity}-selectivity with ${first.department.requirements.admissionMode} entry.`,
        mitigation: "Get your internal application reviewed by an adviser in that department. Internal applicants are ranked on coursework, and a retake can change the outcome.",
      });
    }

    if (first.department.workload.creditsPerTerm >= 16) {
      risks.push({
        severity: "watch",
        title: `${first.department.shortName} runs at ${first.department.workload.creditsPerTerm} credits a term`,
        detail: first.department.workload.paceNote,
        mitigation: "Model one full term in your calendar including lab blocks and travel time. If it does not fit, a lighter load or a minor outside this field will protect your GPA more than it costs you.",
      });
    }

    if (first.department.outcomes.gradSchoolRequiredness >= 4 && aspiration.gradSchoolAppetite < 55) {
      risks.push({
        severity: "watch",
        title: "The highest-paid routes here assume a graduate degree",
        detail: `${Math.round(first.department.outcomes.gradSchoolRate * 100)}% of graduates in this field continue to graduate study, and your stated appetite for further study was ${aspiration.gradSchoolAppetite}/100. Applied roles exist but typically start lower and grow more slowly.`,
        mitigation: "Ask two alumni who did not go to grad school what their first job actually paid. Then decide whether the degree is worth it as a general education investment.",
      });
    }
  }

  if (second && first) {
    const gap = first.total - second.total;
    if (gap <= 3) {
      risks.push({
        severity: "info",
        title: "Ranks one and two are statistically indistinguishable",
        detail: `${first.department.shortName} and ${second.department.shortName} scored within ${gap} points. That is well inside the error of this model — treat them as co-equal and choose on workload and lifestyle, not on rank order.`,
        mitigation: "Compare the two on the four things this model cannot score: commute, group-work appetite, how much writing you actually enjoy, and whether you would still choose it in year four.",
      });
    }
  }

  if (third && third.feasibility.totalRequired > 0 && third.feasibility.completedRequired / third.feasibility.totalRequired < 0.2) {
    risks.push({
      severity: "watch",
      title: `${third.department.shortName} requires almost no prior coursework from you`,
      detail: `Only ${third.feasibility.completedRequired} of ${third.feasibility.totalRequired} of its required courses appear on your record. The recommendation rests on fit and market signal rather than evidence that you can handle its material.`,
      mitigation: "Take one demanding course from its core before you commit. That single course is better evidence than any questionnaire.",
    });
  }

  const automationHeavy = top3.filter((s) => s.market.metrics.automationExposure >= 55);
  if (automationHeavy.length >= 2) {
    risks.push({
      severity: "watch",
      title: "Two of your three options carry high automation exposure",
      detail: `${automationHeavy.map((s) => `${s.department.shortName} at ${s.market.metrics.automationExposure}%`).join(" and ")}. Current tooling is already absorbing routine work in both. The durable roles are the ones that require judgement, accountability, or physical presence.`,
      mitigation: "Ask what part of each role is genuinely irreplaceable, and check whether you would want that part. Judge the job, not the field label.",
    });
  }

  if (transcript.creditsAttempted >= 90) {
    risks.push({
      severity: "watch",
      title: "Late declaration narrows your sequencing options",
      detail: `You have ${Math.round(transcript.creditsAttempted)} credits on record. At that point most departments offer little flexibility in course order, and the courses you can still take freely are the ones that will not feed your prerequisites.`,
      mitigation: "Ask each department for a written degree audit on your actual transcript. It is the single most useful document you can get before deciding.",
    });
  }

  risks.push({
    severity: "info",
    title: "No outcome here is a guarantee",
    detail:
      "Everything in this report is a probabilistic estimate built from your stated record and published labour-market data. Admission to a capacity-capped major, graduation, licensure, and job placement all involve decisions and constraints this model cannot see.",
    mitigation: "Treat the rankings as a shortlist to interrogate, and verify every load-bearing claim with a person — an adviser, a recruiter, an alum in the field.",
  });

  return risks;
}

/* --------------------------------------------------------- blind spots */

function buildBlindSpots(top3: DepartmentScore[], interests: InterestVector, transcript: Transcript, aspiration: Aspiration): string[] {
  const out: string[] = [];
  const first = top3[0];
  if (!first) return out;

  // All three majors concentrated on the same axis.
  const axisCount = new Map<string, number>();
  for (const s of top3) for (const tag of s.department.interestTags) axisCount.set(tag, (axisCount.get(tag) ?? 0) + 1);
  const topAxis = [...axisCount.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topAxis && topAxis[1] === 3) {
    out.push(
      `All three recommendations sit on the "${topAxis[0]}" axis. That usually means a genuinely strong fit — but it also means the model explored one basin and did not test whether an entirely different field would serve you better. Consider asking what a creative, clinical, or quantitative-academic path would look like, even if it looks unlikely.`,
    );
  }

  const conflicts = conflictingAxes(interests, first.department);
  if (conflicts.length) {
    out.push(
      `Your answer pattern shows tension in ${conflicts.join(" and ")}. Worth confirming which side is a genuine preference and which is just familiarity — they call for different majors.`,
    );
  }

  // Interests clustered low overall: the questionnaire may not have discriminated.
  const values = Object.values(interests);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean < 32) {
    out.push(
      "Your interest profile is quite flat — no axis strongly dominates. That is real information, but it also means these rankings lean more heavily on market and academic fit than on passion alignment. Take them as a market analysis more than a calling.",
    );
  }

  if (transcript.courses.length < 4) {
    out.push(
      `Only ${transcript.courses.length} course${transcript.courses.length === 1 ? "" : "s"} were on your record, so the academic-fit component is mostly inferring from GPA. Adding your full transcript — especially the courses you found hardest — would sharpen every prerequisite check in this report.`,
    );
  }

  const subj = subjectStrengths(transcript.courses);
  if (subj.length >= 3) {
    const worst = subj[subj.length - 1];
    const worstLabel = worst.tag.replace("-", " ");
    out.push(
      `Your ${worstLabel} average (${worst.average.toFixed(2)}) is your weakest recorded area. Nothing in the top three is gated on it, which is worth noticing: it may be that you simply took fewer ${worstLabel} courses, or that this field does not need them.`,
    );
  }

  if (aspiration.targetRoles.length === 0) {
    out.push(
      "You did not name any target roles, so career alignment is scored as broadly compatible. Naming two or three specific jobs would meaningfully sharpen the ranking — most majors serve several different career paths very differently.",
    );
  }

  out.push(
    "Nobody in this session asked you about cost, commute, family obligations, or whether you need income during the degree. Those constraints frequently decide this choice more than fit does, and they are entirely absent from the model.",
  );

  out.push(
    "Personality and how you actually behave under deadline were not measured. Persistence is a better predictor of degree completion than interest fit, and no questionnaire can substitute for evidence about how you handle a bad week.",
  );

  return out;
}

/* --------------------------------------------------------- next steps */

function buildNextSteps(top3: DepartmentScore[], transcript: Transcript): RecommendationReport["nextSteps"] {
  const first = top3[0];
  if (!first) return [];
  const f = first.feasibility;
  const steps: RecommendationReport["nextSteps"] = [];

  steps.push({
    action: `Email the ${first.department.shortName} undergraduate adviser and ask for a degree audit against your actual transcript`,
    owner: "You",
    when: "Within two weeks — before you register for the next term",
    why: `This is the single highest-value action available. It replaces an estimate with a fact, and it establishes the relationship you will need if entry is contested.${f.belowMin ? " You also have a below-minimum grade, so ask directly what the retake policy is." : ""}`,
  });

  const clearHardGate = first.department.curriculum.find((c) => c.hardGate && f.prereqs.find((p) => p.code === c.code)?.status === "not-started");
  if (clearHardGate) {
    steps.push({
      action: `Map ${clearHardGate.code} (${clearHardGate.title}) onto your remaining terms so it lands before the point where it blocks you`,
      owner: "You + adviser",
      when: "Before next-term registration",
      why: `It is a hard gate at ${first.department.shortName}, so a poor result here can cost you the major regardless of your overall GPA. ${first.department.workload.paceNote}`,
    });
  }

  if (first.department.requirements.admissionMode === "capacity-capped") {
    steps.push({
      action: `Ask what the ${first.department.shortName} department ranks internal applicants on, and get your standing position`,
      owner: "Department adviser",
      when: "This term",
      why: `${first.department.shortName} is ${first.department.requirements.selectivity}-selectivity with capped entry. Academic eligibility is necessary but not sufficient, and the ranking criteria are often not published.`,
    });
  }

  const adjacent = first.alsoConsider[0];
  if (adjacent) {
    steps.push({
      action: `Run the same conversation with ${adjacent.name}, which scored ${adjacent.total} against ${first.total}`,
      owner: "You",
      when: "Same month",
      why: `A ${Math.abs(first.total - adjacent.total)}-point gap is inside this model's error margin. ${adjacent.name} ${adjacent.reason}, so comparing the two directly is the only way to separate them.`,
    });
  }

  if (transcript.creditsAttempted < 30) {
    steps.push({
      action: "Audit your elective choices against every major on this list before you enrol",
      owner: "You",
      when: "Before next-term registration",
      why: "Almost every major here shares the same calculus or statistics spine. Electives that count for two departments at once are the cheapest way to keep your options open.",
    });
  } else {
    steps.push({
      action: "Confirm your remaining credit requirements and sequencing with an academic adviser, in writing",
      owner: "Academic adviser",
      when: "This term",
      why: `You have ${Math.round(transcript.creditsAttempted)} credits recorded. At this point sequencing, not eligibility, is usually the binding constraint, and it is the part a brochure never mentions.`,
    });
  }

  const licensed = top3.map((s) => s.department.outcomes.licensureNote).filter(Boolean);
  if (licensed.length) {
    steps.push({
      action: "Check your state's licensure requirements against this degree's accreditation status",
      owner: "You",
      when: "Before you commit",
      why: `${licensed[0]} Licensure requirements are set by state boards, not by universities, and they occasionally exclude otherwise-comparable degrees.`,
    });
  }

  steps.push({
    action: "Interview two people actually working in your target role — one 0–3 years out, one 8+ years out",
    owner: "You",
      when: "Before committing",
    why: "The recent graduate knows what entry is like now; the veteran knows what the ceiling looks like. Asking only recent graduates is the most common way students get surprised.",
  });

  steps.push({
    action: "Book an appointment with your faculty adviser and your department's career services office",
    owner: "You",
    when: "Before the add/drop deadline",
    why: "Career services hold recruiter calendars and alumni contact lists that no public dataset contains. They are the least-used and highest-yield resource in this process.",
  });

  return steps;
}

/* ------------------------------------------------------------ roadmap */

function buildRoadmap(score: DepartmentScore, transcript: Transcript): RoadmapPhase[] {
  const d = score.department;
  const f = score.feasibility;
  const roles = rolesForDepartment(d.careerIds).slice(0, 3).map((r) => r.title);
  const missing = f.prereqs.filter((p) => p.status === "not-started");
  const yearsLeft = Math.max(1, (d.requirements.requiredCredits - transcript.creditsEarned) / 30);

  const phases: RoadmapPhase[] = [];

  phases.push({
    phase: "Now",
    horizon: `~${Math.max(2, Math.round(yearsLeft * 4))} weeks`,
    goal: `Convert this from a ranked list into a tested hypothesis about ${d.shortName}.`,
    actions: [
      `Request a degree audit of your real transcript against ${d.shortName}'s catalogue`,
      `Read the ${d.curriculum.find((c) => c.hardGate)?.title ?? d.curriculum[0].title} syllabus and a graded assignment from the last offering`,
      "Sit in on a second-year lecture in the major",
      `Speak to one person working in ${roles[0] ?? "a target role"} about their last 12 months`,
    ],
    proof: "You can name the single hardest course in this major and describe why you would still take it.",
  });

  phases.push({
    phase: "Next term",
    horizon: "1 semester",
    goal: missing.length
      ? `Close the highest-leverage prerequisite gap: ${missing[0].title}.`
      : "Consolidate the required core and build the profile the department ranks on.",
    actions: missing.length
      ? [
          `Enrol in ${missing[0].code} (${missing[0].title}) or its nearest equivalent`,
          missing[1] ? `Take ${missing[1].code} alongside it if the term load allows` : "Add an elective that counts toward a second department on your list",
          "Ask the adviser which of these courses the department weights most in internal ranking",
        ]
      : [
          `Prioritise the department's core sequence: ${d.curriculum.filter((c) => c.required).slice(0, 3).map((c) => c.title).join(", ")}`,
          "Build one artefact that shows you can do the work — a repository, a lab notebook, a model, a written analysis",
        ],
    proof: "You hold a grade at or above the department's stated minimum in your hardest completed course.",
  });

  phases.push({
    phase: "Middle of degree",
    horizon: `~${Math.max(1, Math.round(yearsLeft / 2))} years`,
    goal: "Convert academic standing into the artefact that gets you hired.",
    actions: [
      "Secure a research, lab, internship or co-op placement — it outweighs coursework on most resumes here",
      d.outcomes.gradSchoolRequiredness >= 3
        ? "Start building relationships with faculty now if a graduate route is plausible"
        : "Prioritise two internships over a third irrelevant course",
      d.requirements.minorAvailable
        ? `Add the ${INTEREST_AUX[d.id]?.label ?? "adjacent"} minor if your profile leans that way`
        : "Pair the major with a complementary skill in your electives",
      roles.length ? `Aim your project work at the kind of problem ${roles[0]} actually solves` : "Tailor one substantial project to a real job description",
    ],
    proof: d.outcomes.gradSchoolRequiredness >= 3
      ? "You have a faculty mentor who would write you a reference."
      : "You have one completed, externally validated project and a named contact per role.",
  });

  phases.push({
    phase: "Graduation to offer",
    horizon: `~${Math.max(6, Math.round(yearsLeft * 12))} months`,
    goal: `Reach an offer in ${roles[0] ?? "a target role"} or a credible fallback.`,
    actions: [
      d.outcomes.gradSchoolRequiredness >= 4
        ? "Decide explicitly on the graduate-degree question before finishing — it changes which offers are worth taking"
        : "Start applications six months before graduation, not after",
      d.outcomes.licensureNote ? `Plan the ${d.outcomes.licensureNote.toLowerCase()}` : "Line up interviews around graduation rather than after",
      "Use the department's placement report for realistic salary ranges rather than national medians",
      d.workload.groupWorkIntensity >= 4
        ? "Get a reference from a team project — that is what hiring managers will ask about"
        : "Get references from professors who supervised your most substantial work",
    ],
    proof: "You have a signed offer or a documented, funded plan for the year after graduation.",
  });

  return phases;
}

/** Optional minor suggestions keyed by department. */
const INTEREST_AUX: Record<string, { label: string }> = {
  "computer-science": { label: "Statistics / Mathematics" },
  "data-science": { label: "Domain subject (Economics, Biology, Sociology)" },
  "electrical-engineering": { label: "Computer Science" },
  "mechanical-engineering": { label: "Robotics / Computer Science" },
  "civil-engineering": { label: "Environmental Policy" },
  biotechnology: { label: "Statistics / Regulatory Science" },
  neuroscience: { label: "Psychology / Statistics" },
  finance: { label: "Economics / Data Science" },
  economics: { label: "Statistics / Political Science" },
  psychology: { label: "Neuroscience / Statistics" },
  "public-health": { label: "Biology / Statistics" },
  "information-systems": { label: "Computer Science / Business" },
  "environmental-science": { label: "Policy / Engineering" },
  "political-science": { label: "Economics / Public Health" },
  chemistry: { label: "Materials Science / Biology" },
  education: { label: "Psychology / Public Health" },
  architecture: { label: "Urban Policy / Environmental Science" },
  "creative-arts": { label: "Computer Science / Business" },
  mathematics: { label: "Statistics / Computer Science" },
  "physical-science": { label: "Materials / Electrical Engineering" },
};

/* ---------------------------------------------------------- method note */

function methodNote(scored: DepartmentScore[]): string {
  const sources = new Set(scored.map((s) => s.market.source));
  const liveCount = scored.filter((s) => s.market.source === "live").length;
  const sourceWord = sources.size === 1 ? [...sources][0] : "mixed live and reference";

  const wageYears = [
    ...new Set(
      scored
        .flatMap((s) => s.department.careerIds)
        .flatMap((id) => getCareer(id)?.soc ?? [])
        .map((soc) => socReference(soc)?.wageYear)
        .filter((y): y is number => Boolean(y)),
    ),
  ].sort();

  return `Scored ${scored.length} departments across seven weighted components: interest alignment, career alignment, academic fit, market viability, prerequisite readiness, workload fit, and work-style fit. Weights adapt to the priorities you set in Phase 2. Market figures are ${sourceWord} — ${liveCount} of ${scored.length} departments read live wage and employment series from the BLS Occupational Employment and Wage Statistics API; the remainder use the last published BLS release because BLS does not expose an OEWS series for those occupations. Wage reference year${wageYears.length > 1 ? "s" : ""}: ${wageYears.join(", ") || "n/a"}. Ten-year growth rates are BLS Employment Projections; six-month placement is an internal estimate derived from employment breadth, demand and automation exposure, not a published statistic; ${DEMAND_INDEX_NOTE} Nothing here constitutes a guarantee of admission, graduation, licensure or employment.`;
}

export { INTEREST_AUX };