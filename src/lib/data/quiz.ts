import type { InterestVector, WorkStyle } from "@/lib/types";

/**
 * Aspiration questionnaire (Phase 2).
 *
 * Each answer carries an `axis` contribution used to build the InterestVector,
 * plus optional modifier contributions (weight load, grad-school appetite,
 * optionality) that feed the composite score later.
 */

export interface QuizOption {
  id: string;
  label: string;
  /** Interest-axis deltas applied when selected. */
  axis: Partial<InterestVector>;
  weight?: number;
  gradSchool?: number;
  optionality?: number;
  /** Free-text fragment injected into the profile synthesis. */
  signal?: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  helper: string;
  kind: "single" | "multi";
  options: QuizOption[];
}

export const QUIZ: QuizQuestion[] = [
  {
    id: "q1-problem",
    prompt: "A problem lands in front of you with no obvious solution. What do you reach for first?",
    helper: "Pick the instinct, not the subject you think sounds impressive.",
    kind: "single",
    options: [
      {
        id: "q1a",
        label: "Break it into steps until a machine could follow them",
        axis: { computation: 34, quantitative: 10 },
        signal: "decompose problems into explicit procedure",
      },
      {
        id: "q1b",
        label: "Model it with numbers and look at what the numbers say",
        axis: { quantitative: 30, computation: 6 },
        signal: "seek quantitative structure",
      },
      {
        id: "q1c",
        label: "Study the system as it is — how the parts actually interact",
        axis: { physicalSystem: 26, lifeScience: 8 },
        signal: "understand real-world system dynamics",
      },
      {
        id: "q1d",
        label: "Talk to the people involved and find out what is really going on",
        axis: { humanBehavior: 22, societalImpact: 14, leadership: 8 },
        signal: "start from the human context",
      },
      {
        id: "q1e",
        label: "Sketch several radically different futures before judging any",
        axis: { creativeExpression: 30, humanBehavior: 6 },
        signal: "diverge before converging",
      },
    ],
  },
  {
    id: "q2-environment",
    prompt: "Which work environment sounds like your actual preference on a Tuesday?",
    helper: "Be honest about pacing and visibility rather than prestige.",
    kind: "single",
    options: [
      {
        id: "q2a",
        label: "A lab or institute where I can spend weeks on one question",
        axis: { lifeScience: 16, quantitative: 8 },
        gradSchool: 26,
        signal: "wants deep, open-ended investigation",
      },
      {
        id: "q2b",
        label: "A structured engineering team shipping a defined product",
        axis: { physicalSystem: 26, computation: 6 },
        signal: "wants a concrete artefact with a spec",
      },
      {
        id: "q2c",
        label: "A fast-moving startup where I own a whole problem",
        axis: { computation: 14, leadership: 18 },
        gradSchool: -10,
        signal: "wants ownership and speed",
      },
      {
        id: "q2d",
        label: "An agency or studio working on varied client problems",
        axis: { creativeExpression: 28, societalImpact: 6 },
        gradSchool: -6,
        signal: "wants variety and craft",
      },
      {
        id: "q2e",
        label: "A classroom, clinic, or public-facing practice",
        axis: { societalImpact: 24, humanBehavior: 12 },
        gradSchool: 8,
        signal: "wants direct human impact",
      },
    ],
  },
  {
    id: "q3-curiosity",
    prompt: "Which of these have you gone down on your own time, without being graded?",
    helper: "Multi-select. Self-directed curiosity is the single best predictor of major fit.",
    kind: "multi",
    options: [
      { id: "q3a", label: "Writing or extending a piece of software", axis: { computation: 26 } },
      { id: "q3b", label: "Analysis in a spreadsheet, notebook or statistics package", axis: { quantitative: 26 } },
      { id: "q3c", label: "Dissecting how a living thing works", axis: { lifeScience: 24 } },
      { id: "q3d", label: "Taking something apart or building a mechanism", axis: { physicalSystem: 24 } },
      { id: "q3e", label: "Reading research on how people think or behave", axis: { humanBehavior: 24 } },
      { id: "q3f", label: "Making something visual or designed", axis: { creativeExpression: 24 } },
      { id: "q3g", label: "Following policy, debate or a civic issue closely", axis: { societalImpact: 24 } },
      { id: "q3h", label: "Organising people, running events or leading a project", axis: { leadership: 24 } },
    ],
  },
  {
    id: "q4-strength",
    prompt: "Which subjects have historically come easiest to you?",
    helper: "Multi-select. Used to weight the academic-fit component.",
    kind: "multi",
    options: [
      { id: "q4a", label: "Algebra, calculus, or anything with a proof", axis: { quantitative: 20 } },
      { id: "q4b", label: "Physics or engineering mechanics", axis: { physicalSystem: 20, quantitative: 8 } },
      { id: "q4c", label: "Biology, chemistry, or the life sciences", axis: { lifeScience: 20 } },
      { id: "q4d", label: "Computer science or programming", axis: { computation: 20 } },
      { id: "q4e", label: "Psychology, sociology, or the social sciences", axis: { humanBehavior: 20 } },
      { id: "q4f", label: "Writing, language, history, or philosophy", axis: { creativeExpression: 18, societalImpact: 6 } },
      { id: "q4g", label: "Economics, statistics, or data analysis", axis: { quantitative: 14, societalImpact: 10 } },
      { id: "q4h", label: "Studio art, design, or music", axis: { creativeExpression: 20 } },
    ],
  },
  {
    id: "q5-tolerances",
    prompt: "Which statements describe you honestly?",
    helper: "Multi-select. This calibrates workload tolerance and required-discipline tolerance.",
    kind: "multi",
    options: [
      { id: "q5a", label: "Three 4-hour lab sessions in one week is fine", axis: { lifeScience: 10, physicalSystem: 10 }, weight: 16 },
      { id: "q5b", label: "I can handle courses that are hard on their own terms", axis: { quantitative: 18 }, weight: 14 },
      { id: "q5d", label: "I prefer most of my work to be written rather than spoken", axis: {}, weight: -6 },
      { id: "q5e", label: "Team projects drain me more than individual work", axis: {}, weight: -8 },
      { id: "q5f", label: "I would rather start earning sooner than add another degree", axis: {}, gradSchool: -22, optionality: 12 },
      { id: "q5g", label: "I'm genuinely interested in a five-year research path", axis: {}, gradSchool: 24 },
    ],
  },
  {
    id: "q6-signal",
    prompt: "What has historically pulled you away from a subject?",
    helper: "Multi-select. Frustration patterns are diagnostic.",
    kind: "multi",
    options: [
      { id: "q6a", label: "Not enough room to build something", axis: { computation: 16, physicalSystem: 12 } },
      { id: "q6b", label: "Everything is memorisation with no underlying structure", axis: { quantitative: 18 } },
      { id: "q6c", label: "Not enough contact with real systems or people", axis: { physicalSystem: 14, societalImpact: 10, leadership: 10 } },
      { id: "q6d", label: "Lab time is tedious and repetitive", axis: {}, weight: -14 },
      { id: "q6e", label: "Too much writing and too little building", axis: {}, weight: -8 },
      { id: "q6f", label: "Constantly staring at a screen with no human outcome", axis: {}, weight: -6 },
    ],
  },
  {
    id: "q7-horizon",
    prompt: "Five years out, which outcome would feel like success?",
    helper: "Single choice. Calibrates the pay / stability / impact weighting.",
    kind: "single",
    options: [
      { id: "q7a", label: "Deep expertise and a reputation in a specialist field", axis: {}, gradSchool: 16, weight: 4 },
      { id: "q7b", label: "A senior role with real decision authority", axis: { leadership: 22 }, weight: 10 },
      { id: "q7c", label: "A well-paid, stable, low-surprise career", axis: {}, weight: 14 },
      { id: "q7d", label: "Work that measurably improves other people's lives", axis: { societalImpact: 28 }, weight: -4 },
      { id: "q7e", label: "Enough optionality to change direction later if I want", axis: {}, optionality: 24 },
    ],
  },
];

/* ------------------------------------------------------- distress watch */

export const DISTRESS_PATTERNS: { re: RegExp; weight: number }[] = [
  { re: /\b(i can'?t|cannot|can'?t) (go on|take it|keep going|do this)\b/i, weight: 3 },
  { re: /\b(worthless|useless|ruined|hopeless)\b/i, weight: 5 },
  { re: /\b(hate myself|hate my life|want to (disappear|give up)\b)/i, weight: 6 },
  { re: /\b(panic|panic attack|anxiety attack)\b/i, weight: 3 },
  { re: /\b(i'?m going to fail|going to fail out|failing out)\b/i, weight: 3 },
  { re: /\b(burnt out|burned out|exhausted|numb)\b/i, weight: 3 },
  { re: /\b(no reason to (live|continue)|don'?t want to (live|be here))\b/i, weight: 7 },
  { re: /\b(overwhelmed|stressed out|can'?t breathe)\b/i, weight: 2 },
  { re: /\b(my (parents|family) (expect|expected) me to)\b/i, weight: 1 },
];

export const WELLNESS_RESOURCES = [
  {
    label: "Campus counselling centre",
    detail: "Free, confidential, and typically staffed by licensed clinicians. Most campuses offer same-week urgent appointments and a 24/7 crisis line.",
    action: "Search “[your university] counselling centre” — walk-in hours are usually published on the student affairs page.",
  },
  {
    label: "Academic advising & retention",
    detail: "A separate office from counselling. They can discuss leave of absence, reduced course load, and what will happen to your transcript — which is often the concrete worry underneath the distress.",
    action: "Email your faculty adviser before any deadline. A formal conversation changes your options more than almost anything else.",
  },
  {
    label: "988 Suicide & Crisis Lifeline",
    detail: "Free, confidential support in the US, 24/7, by call, text or chat. Available even if you have no insurance and are not a student.",
    action: "Call or text 988. In the UK & ROI, contact Samaritans on 116 123.",
  },
  {
    label: "Student emergency & wellbeing line",
    detail: "Most universities run a 24-hour line staffed by student peer supporters or counsellors specifically for moments like this.",
    action: "Look for “wellbeing” or “helpline” in your student portal — it is usually one search away and bookmarked on the homepage.",
  },
];

export const WORK_STYLE_OPTIONS: { id: WorkStyle; label: string; blurb: string }[] = [
  { id: "research", label: "Research", blurb: "Open-ended investigation, publication, grants." },
  { id: "corporate", label: "Corporate", blurb: "Defined teams inside an established organisation." },
  { id: "startup", label: "Startup", blurb: "Small teams, ambiguity, fast iteration." },
  { id: "remote", label: "Remote-first", blurb: "Location independence as a requirement." },
  { id: "clinical", label: "Clinical", blurb: "Patient-facing, protocol-driven practice." },
  { id: "fieldwork", label: "Field work", blurb: "On-site, site-based or instrumented work." },
  { id: "creative-studio", label: "Studio", blurb: "Self-directed creative practice and critique." },
  { id: "public-service", label: "Public service", blurb: "Institutional or civic mission roles." },
];