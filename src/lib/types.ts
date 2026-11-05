/**
 * Core domain types for the Dept Selection Guide.
 *
 * Design notes:
 * - Academic records never leave the client. The transcript is parsed and scored
 *   in the browser; the server only ever receives derived, non-identifying scores.
 * - Every market figure is carried with provenance so the UI can show freshness.
 */

/* ------------------------------------------------------------------ marks */

/** Grade points on a 4.0 scale. Decimal values are legitimate (A- = 3.7). */
export type GradePoint = number;
export type GradeLetter = "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C" | "C-" | "D" | "F";

export interface TranscriptCourse {
  id: string;
  /** Canonical code, upper-cased, e.g. "CS 201". */
  code: string;
  title: string;
  credits: number;
  /** null => in progress / no grade yet. */
  grade: GradePoint | null;
  gradeLetter: GradeLetter | null;
  term?: string;
  subject: SubjectTag;
}

export type SubjectTag =
  | "math"
  | "science"
  | "computing"
  | "engineering"
  | "humanities"
  | "social-science"
  | "business"
  | "health"
  | "arts"
  | "other";

export const SUBJECT_TAGS: { id: SubjectTag; label: string }[] = [
  { id: "math", label: "Mathematics" },
  { id: "computing", label: "Computing" },
  { id: "science", label: "Natural Science" },
  { id: "engineering", label: "Engineering" },
  { id: "business", label: "Business" },
  { id: "social-science", label: "Social Science" },
  { id: "humanities", label: "Humanities" },
  { id: "health", label: "Health & Medicine" },
  { id: "arts", label: "Arts & Design" },
  { id: "other", label: "Other" },
];

export interface Transcript {
  courses: TranscriptCourse[];
  /** Cumulative GPA on a 4.0 scale, credits-weighted. */
  gpa: number;
  creditsAttempted: number;
  creditsEarned: number;
  /** Credits where the student earned a C or better. */
  creditsStrong: number;
  scaleMax: 4 | 5;
  currentTermCredits: number;
}

/* --------------------------------------------------- curriculum database */

export type CourseCategory =
  | "math"
  | "science"
  | "computing"
  | "engineering"
  | "core"
  | "elective"
  | "capstone"
  | "lab";

export interface CurriculumCourse {
  code: string;
  title: string;
  credits: number;
  category: CourseCategory;
  /** Must be completed (or in progress) to be in good standing in the major. */
  required: boolean;
  /** Failing this course triggers removal from the major at most institutions. */
  hardGate?: boolean;
  /** Minimum acceptable letter grade, on the 4.0 scale. */
  minGrade?: number;
  /** Minimum overall GPA required to declare the major. */
  minCumulativeGpa?: number;
  /** Semester in which this is normally taken. */
  typicalTerm?: number;
}

export interface DepartmentRequirements {
  overallGpa: number;
  requiredCredits: number;
  /** Credits that must come from the listed subject groups. */
  coreCreditsRequired: number;
  admissionMode: "open" | "selective" | "capacity-capped" | "audition";
  /** Rough selectivity band used for risk framing. */
  selectivity: "low" | "moderate" | "high" | "very-high";
  acceptsLateDeclaration: boolean;
  minorAvailable: boolean;
}

export type WorkStyle =
  | "research"
  | "corporate"
  | "startup"
  | "remote"
  | "clinical"
  | "fieldwork"
  | "creative-studio"
  | "public-service"
  | "government"
  | "nonprofit"
  | "self-employed";

export interface Department {
  id: string;
  name: string;
  shortName: string;
  code: string;
  school: string;
  tagline: string;
  blurb: string;
  /** Interest axes this department feeds. Keys must exist in InterestVector. */
  interestTags: (keyof InterestVector)[];
  /** Career role ids from the role catalogue. */
  careerIds: string[];
  /** Distinctive undergraduate courses used for prerequisite matching. */
  curriculum: CurriculumCourse[];
  requirements: DepartmentRequirements;
  workload: {
    creditsPerTerm: number;
    /** 1 (low) – 5 (extreme) */
    mathIntensity: number;
    writingIntensity: number;
    labIntensity: number;
    groupWorkIntensity: number;
    /** Qualitative note surfaced in risk analysis. */
    paceNote: string;
  };
  outcomes: {
    medianStartingSalary: number;
    gradSchoolRate: number;
    /** 1–5 how often grad school is effectively required. */
    gradSchoolRequiredness: number;
    licensureNote?: string;
  };
  /** Ids of adjacent departments worth also considering. */
  adjacentIds: string[];
  /** Accent hue (OKLCH lightness-agnostic) used for the visual identity. */
  hue: number;
}

/* -------------------------------------------------------------- interests */

/**
 * Eight orthogonal-ish interest/work axes. Each axis is 0–100 after
 * questionnaire scoring. Raw quiz answers feed these via weighted mapping.
 */
export interface InterestVector {
  computation: number;
  quantitative: number;
  lifeScience: number;
  physicalSystem: number;
  humanBehavior: number;
  creativeExpression: number;
  societalImpact: number;
  leadership: number;
}

export const INTEREST_AXES: {
  key: keyof InterestVector;
  label: string;
  short: string;
  blurb: string;
  opposedTo: keyof InterestVector | null;
}[] = [
  {
    key: "computation",
    label: "Computing & Logic",
    short: "Computing",
    blurb: "Abstract systems, algorithms, automation, and the craft of breaking problems into rules a machine can follow.",
    opposedTo: null,
  },
  {
    key: "quantitative",
    label: "Quantitative & Modelling",
    short: "Quantitative",
    blurb: "Numbers as a language for describing reality — statistics, optimisation, simulation, forecasting.",
    opposedTo: null,
  },
  {
    key: "lifeScience",
    label: "Life Science & Health",
    short: "Life Science",
    blurb: "Living systems: molecules, cells, organisms, patients, populations.",
    opposedTo: "physicalSystem",
  },
  {
    key: "physicalSystem",
    label: "Physical Systems & Machines",
    short: "Physical Systems",
    blurb: "Matter, energy, force and fabrication — how the physical world is built and controlled.",
    opposedTo: null,
  },
  {
    key: "humanBehavior",
    label: "Human Behaviour & Mind",
    short: "Human Behaviour",
    blurb: "Cognition, persuasion, development, and the evidence base of why people do what they do.",
    opposedTo: null,
  },
  {
    key: "creativeExpression",
    label: "Creative Expression & Design",
    short: "Creative",
    blurb: "Making things that communicate: form, narrative, visual and spatial design, written voice.",
    opposedTo: "quantitative",
  },
  {
    key: "societalImpact",
    label: "Society, Policy & Impact",
    short: "Societal",
    blurb: "Institutions, justice, policy, sustainability, and the systems that shape collective outcomes.",
    opposedTo: null,
  },
  {
    key: "leadership",
    label: "Coordination & Leadership",
    short: "Leadership",
    blurb: "Organising people toward outcomes — operations, strategy, negotiation, teaching.",
    opposedTo: "lifeScience",
  },
];

/* ----------------------------------------------------------- aspirations */

export interface Aspiration {
  targetRoles: string[];
  workStyles: WorkStyle[];
  environment: "large-corporate" | "small-team" | "startup" | "nonprofit" | "government" | "self-employed" | "undecided";
  /** 0–100 */
  workloadTolerance: number;
  /** 0–100 desire to keep options open (explores / bridges). */
  optionalityBias: number;
  /** 0–100 appetite for 5+ year academic training. */
  gradSchoolAppetite: number;
  /** Free-text "what you want your days to look like". */
  dayInLife: string;
  priorities: { id: string; label: string; weight: number }[];
}

export const DEFAULT_PRIORITIES = [
  { id: "pay", label: "Compensation", weight: 70 },
  { id: "stability", label: "Job stability", weight: 75 },
  { id: "impact", label: "Social impact", weight: 60 },
  { id: "flexibility", label: "Work flexibility", weight: 65 },
  { id: "interest", label: "Pure intellectual interest", weight: 80 },
  { id: "advancement", label: "Promotion & growth ceiling", weight: 70 },
  { id: "location", label: "Location & lifestyle", weight: 55 },
] as const;

/* ---------------------------------------------------------------- market */

export interface MarketMetric {
  /** Median annual wage for the field's dominant occupation, USD. */
  medianSalary: number;
  salaryP25: number;
  salaryP75: number;
  /** Projected 10-year employment growth, percent. */
  projectedGrowth: number;
  /** Share of graduates reporting employment or further study within 6 months. */
  placementRate: number;
  /** Openings per 100 graduates per year, normalised index. */
  demandIndex: number;
  /** Share of postings requiring this skill cluster, percent. */
  skillDemand: number;
  automationExposure: number;
  sampleSize: number;
}

export type MarketSource = "live" | "cached" | "seed";

export interface MarketSnapshot {
  fetchedAt: string;
  source: MarketSource;
  /** Series identifier used upstream, e.g. BLS SOC code. */
  seriesId: string;
  metrics: MarketMetric;
  /** Human-readable note rendered under the freshness badge. */
  provenance: string;
}

/* -------------------------------------------------------------- scoring */

export type Confidence = "high" | "moderate" | "emerging" | "insufficient";

export interface ScoreComponent {
  key: string;
  label: string;
  /** 0–100 contribution before weighting. */
  value: number;
  weight: number;
  /** Short explanation of how this number was reached. */
  rationale: string;
}

export interface PrereqStatus {
  code: string;
  title: string;
  category: CourseCategory;
  credits: number;
  status: "completed" | "in-progress" | "not-started" | "below-min" | "waived";
  grade: GradePoint | null;
  required: boolean;
  hardGate: boolean;
  minGrade?: number;
  note: string;
}

export interface FeasibilityReport {
  departmentId: string;
  /** 0–100 */
  readiness: number;
  status: "clear" | "workable" | "at-risk" | "blocked";
  meetsGpaGate: boolean;
  requiredGpa: number;
  studentGpa: number;
  completedRequired: number;
  totalRequired: number;
  inProgress: number;
  belowMin: number;
  missingHardGates: string[];
  projectedCreditsNeeded: number;
  prereqs: PrereqStatus[];
  notes: string[];
}

export interface RiskFlag {
  severity: "info" | "watch" | "high";
  title: string;
  detail: string;
  mitigation: string;
}

export interface DepartmentScore {
  department: Department;
  /** Final 0–100 composite. */
  total: number;
  /** Human-facing band. */
  band: "exceptional" | "strong" | "viable" | "speculative";
  confidence: Confidence;
  components: ScoreComponent[];
  feasibility: FeasibilityReport;
  market: MarketSnapshot;
  /** Adjacent majors also worth a look, ranked. */
  alsoConsider: { id: string; name: string; reason: string; total: number }[];
  strengths: string[];
  tradeoffs: string[];
  roadmap: RoadmapPhase[];
}

export interface RoadmapPhase {
  phase: string;
  horizon: string;
  goal: string;
  actions: string[];
  proof: string;
}

/* ---------------------------------------------------------------- report */

export interface RecommendationReport {
  id: string;
  generatedAt: string;
  /** Departments that had market data and were therefore scored. */
  poolSize: number;
  studentProfile: {
    gpa: number;
    scaleMax: 4 | 5;
    credits: number;
    strengthSubjects: { tag: SubjectTag; average: number; count: number }[];
    targetRoles: string[];
    workStyles: WorkStyle[];
    topInterests: { key: keyof InterestVector; value: number }[];
    priorities: { id: string; label: string; weight: number }[];
    dayInLife: string;
  };
  top3: DepartmentScore[];
  runnerUps: { id: string; name: string; total: number; reason: string }[];
  risks: RiskFlag[];
  blindSpots: string[];
  nextSteps: { action: string; owner: string; when: string; why: string }[];
  methodNote: string;
}

/* --------------------------------------------------------------- session */

export type Phase = 1 | 2 | 3 | 4 | 5;

export const PHASES: {
  id: Phase;
  label: string;
  title: string;
  blurb: string;
}[] = [
  { id: 1, label: "Profile", title: "Academic Profile", blurb: "Grades, credits and where your marks actually cluster." },
  { id: 2, label: "Aspiration", title: "Aspiration Mapping", blurb: "The work you want, the environment, your appetite for training." },
  { id: 3, label: "Feasibility", title: "Feasibility & Gap Analysis", blurb: "Every prerequisite, checked against the curriculum database." },
  { id: 4, label: "Market", title: "Market Viability", blurb: "Live demand, salary distribution and automation exposure." },
  { id: 5, label: "Report", title: "Recommendation Report", blurb: "Your ranked shortlist with roadmaps and risk analysis." },
];

export interface DistressSignal {
  detected: boolean;
  severity: "none" | "mild" | "moderate" | "acute";
  matchedPhrases: string[];
  resources: { label: string; detail: string }[];
}