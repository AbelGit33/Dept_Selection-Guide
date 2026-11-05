import {
  type GradeLetter,
  type GradePoint,
  type SubjectTag,
  type Transcript,
  type TranscriptCourse,
} from "@/lib/types";

/* ------------------------------------------------------- grade mapping */

const LETTER_TO_POINT: Record<GradeLetter, GradePoint> = {
  A: 4,
  "A-": 3.7,
  "B+": 3.3,
  B: 3,
  "B-": 2.7,
  "C+": 2.3,
  C: 2,
  "C-": 1.7,
  D: 1,
  F: 0,
};

const POINT_TO_LETTER: { min: number; letter: GradeLetter }[] = [
  { min: 3.85, letter: "A" },
  { min: 3.5, letter: "A-" },
  { min: 3.15, letter: "B+" },
  { min: 2.85, letter: "B" },
  { min: 2.5, letter: "B-" },
  { min: 2.15, letter: "C+" },
  { min: 1.85, letter: "C" },
  { min: 1.5, letter: "C-" },
  { min: 0.85, letter: "D" },
  { min: 0, letter: "F" },
];

export function pointToLetter(point: number): GradeLetter {
  return POINT_TO_LETTER.find((b) => point >= b.min)?.letter ?? "F";
}

/** Percentage bands mapped onto the 4.0 scale, using the conventional US cut points. */
const PERCENT_BANDS: { min: number; letter: GradeLetter }[] = [
  { min: 93, letter: "A" },
  { min: 90, letter: "A-" },
  { min: 87, letter: "B+" },
  { min: 83, letter: "B" },
  { min: 80, letter: "B-" },
  { min: 77, letter: "C+" },
  { min: 73, letter: "C" },
  { min: 70, letter: "C-" },
  { min: 60, letter: "D" },
];

/** Accepts letters, +/- grades, percentages, or raw GPA points. */
export function parseGrade(raw: string): GradePoint | null {
  const token = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (!token) return null;
  if (token in LETTER_TO_POINT) return LETTER_TO_POINT[token as GradeLetter];
  if (["IP", "INPROGRESS", "WIP", "NR", "W", "WAIVED", "AUDIT", "AU"].includes(token)) return null;

  const isPercent = token.includes("%");
  const numeric = Number(token.replace(/[% ]/g, ""));
  if (!Number.isFinite(numeric)) return null;

  // A percentage maps through the standard bands rather than a straight line:
  // 85% is a B (3.0), not the 2.5 a linear 60–100 stretch would produce.
  if (isPercent) {
    if (numeric < 0 || numeric > 100) return null;
    if (numeric < 60) return 0;
    const band = PERCENT_BANDS.find((b) => numeric >= b.min);
    return LETTER_TO_POINT[band?.letter ?? "C-"];
  }

  // Anything above 4.0 is only meaningful as a percentage (4.3, 89, 95…).
  if (numeric > 4) {
    if (numeric <= 100) return parseGrade(`${numeric}%`);
    return null;
  }

  // Already a value on the 4.0 scale.
  if (numeric >= 0 && numeric <= 4) {
    return Math.round(numeric * 10) / 10 as GradePoint;
  }
  return null;
}

export function letterToPoint(letter: string): GradePoint | null {
  return parseGrade(letter);
}

/* ---------------------------------------------------- code normalising */

/** Canonical form: "comp sci 201" -> "CS 201". Keeps the numeric part intact. */
export function normalizeCode(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9& ]/g, " ").replace(/\s+/g, " ").trim();
  const m = cleaned.match(/^([A-Z& ]*?)\s*(\d{1,4}[A-Z]?)$/);
  if (!m) return cleaned;
  return `${m[1].trim().replace(/\s+/g, "")} ${m[2]}`;
}

/**
 * Pulls just the course code out of a chunk that may have a title glued to it,
 * e.g. "MATH 140 Calculus I" -> "MATH 140". Portal exports routinely put the
 * title on the same field as the code, so the code cannot be assumed to be
 * the whole token.
 */
export function extractCode(raw: string): string | null {
  // "&" is kept: interdepartmental prefixes such as "C&EE 201" are real codes.
  const cleaned = raw
    .toUpperCase()
    .replace(/[^A-Z0-9& ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return null;

  // Leading subject prefix (letters, optionally joined by &) + course number.
  const leading = cleaned.match(/^([A-Z]{1,5}(?:&[A-Z]{1,5})*)\s*(\d{1,4}[A-Z]?)(?=\s|$)/);
  if (leading) return `${leading[1].replace(/\s+/g, "")} ${leading[2]}`;

  // Fall back to the whole token when it is code-only.
  if (/^[A-Z]{1,5}(?:&[A-Z]{1,5})*\s*\d{1,4}[A-Z]?$/.test(cleaned)) return normalizeCode(cleaned);

  // Some portals emit a bare course number with no prefix at all.
  if (/^\d{1,4}[A-Z]?$/.test(cleaned)) return cleaned;

  return null;
}

/**
 * Strips the course code from the front of a field and returns whatever is
 * left, with the original casing and punctuation preserved. Portal titles
 * legitimately contain "&" and roman numerals, so this deliberately does not
 * run the text through the code sanitiser.
 */
export function stripCodePrefix(raw: string, code: string): string {
  const trimmed = raw.trim();
  const upper = trimmed.toUpperCase();
  if (!upper.startsWith(code)) return "";
  let rest = trimmed.slice(code.length).trim();
  // Drop a single leading separator left behind by the split.
  rest = rest.replace(/^[\s\-–—:;,|/]+/, "").trim();
  return rest;
}

/** Just the subject prefix, used for matching cross-listed requirements. */
export function codePrefix(code: string): string {
  return normalizeCode(code).split(/\s+/)[0] ?? "";
}

const SUBJECT_KEYWORDS: [RegExp, SubjectTag][] = [
  [/\b(CS|COMP|SC|CSCI|CSIT|CMPT|INFO)\s*\d/i, "computing"],
  [/\b(MATH|MATHEMAT|MA|STAT|STATS|STATI|CALC|ALGEBRA|DISCRETE)\s*\d/i, "math"],
  [/\b(PHYS|PHY)\s*\d/i, "science"],
  [/\b(CHEM|CH)\s*\d/i, "science"],
  [/\b(BIO|BIOL|BIOL|MB|BMC)\s*\d/i, "science"],
  [/\b(NEUR|NRS|PSYCH|BIOP|ECOL|ENV|NUTR)\s*\d/i, "science"],
  [/\b(EE|ENGR|ELEC|ECE|ME|MECH|CE|CIVIL|CHE|AERO|BME|BIOE|MPHY)\s*\d/i, "engineering"],
  [/\b(ECON|ECONOM|POLI|PSCI|SOC|SOCY|PSY|PSYCH|ANTHRO|CRIM|PUBLIC|PUBH|PH)\s*\d/i, "social-science"],
  [/\b(FIN|BUS|ACCT|ACCTG|MKTG|MARKET|MGMT|HR|ENTPR|RE)\s*\d/i, "business"],
  [/\b(NURS|BIOLAB|PHARM|PUBH|CLIN|CARE|KIN)\s*\d/i, "health"],
  [/\b(ART|DES|PHOTO|MUS|MUSIC|ARCH|DAN|THE|ENGL|WRIT|HIST|PHIL|LANG|SPAN|FREN|CHIN)\s*\d/i, "arts"],
  [/\b(HIST|ENGL|WRIT|PHIL|LANG|SPAN|FREN|CHIN|POLI|ART|MUSIC|HISTORY|RELIG)\s*\d/i, "humanities"],
];

export function inferSubject(code: string, title: string): SubjectTag {
  const haystack = `${code} ${title}`;
  for (const [re, tag] of SUBJECT_KEYWORDS) {
    if (re.test(haystack)) return tag;
  }
  return "other";
}

/* ------------------------------------------------------- paste parsing */

/**
 * Accepts the loosely-structured format students actually paste out of a
 * portal. Supported shapes, one course per line:
 *   CS 201, 4, A
 *   CS 201 Data Structures — 4cr — B+
 *   CS 201 | 4 | 3.7
 *   MATH 140 Calculus I 4 A  Fall 2024
 */
export function parseTranscriptText(raw: string): TranscriptCourse[] {
  const lines = raw.split(/\r?\n/);
  const courses: TranscriptCourse[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || /^[-=_*\s]+$/.test(trimmed)) continue;
    if (/^(course|code|title|credits?|grade|term)\b/i.test(trimmed) && !/\d/.test(trimmed)) continue;

    const parts = trimmed
      .split(/\s*[|;,]\s*|\s+[—–\-·]\s+|\s{2,}|\t/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (parts.length === 0) continue;

    // Find the first field that actually yields a course code. A field only
    // counts if, once a code is peeled off the front, something plausible is
    // left behind — that remainder is the title.
    let code: string | null = null;
    let codeIndex = -1;
    let titleLeftover = "";
    for (let i = 0; i < parts.length; i += 1) {
      const found = extractCode(parts[i]);
      if (!found) continue;
      code = found;
      codeIndex = i;
      const remainder = stripCodePrefix(parts[i], found);
      if (remainder.length > 2) titleLeftover = remainder;
      break;
    }

    if (!code || codeIndex === -1) continue;
    if (code.length < 3) continue;

    const rest = [...parts.slice(0, codeIndex), ...parts.slice(codeIndex + 1)];
    const dedupe = code.toUpperCase();
    if (seen.has(dedupe)) continue;

    // Credits are resolved FIRST. A bare credit count such as "4" is also a
    // syntactically valid grade, so scanning for the grade before claiming the
    // credits would read `PHYS 201 | 4 | 3.7` as an A instead of a 3.7.
    const creditsIndex = rest.findIndex((p) => /^\d(\.\d{1,2})?$/.test(p) && Number(p) > 0 && Number(p) <= 20);
    let credits = creditsIndex >= 0 ? Number(rest[creditsIndex]) : 3;
    if (!Number.isFinite(credits) || credits <= 0 || credits > 20) credits = 3;

    // A "3cr" / "3 cr" token is unambiguously credits, never a grade.
    const creditToken = /(?:^|\s)(\d(\.\d{1,2})?)\s*(?:cr|credits?|units?)\b/i;

    const gradeIndex = rest.findIndex((p, i) => {
      if (i === creditsIndex) return false;
      if (creditToken.test(p)) return false;
      return parseGrade(p) !== null || /^(ip|wip|nr|w)$/i.test(p);
    });
    const grade = gradeIndex >= 0 ? parseGrade(rest[gradeIndex]) : null;

    if (creditsIndex === -1) {
      // No standalone numeric field — recover credits from a "3cr" style token.
      const withUnits = rest.find((p) => creditToken.test(p));
      const m = withUnits?.match(creditToken);
      if (m) {
        const n = Number(m[1]);
        if (Number.isFinite(n) && n > 0 && n <= 20) credits = n;
      }
    }

    const titleParts = rest.filter(
      (p, i) =>
        i !== gradeIndex &&
        i !== creditsIndex &&
        !/^(ip|wip|nr|w)$/i.test(p) &&
        !/^\d{4}$/.test(p) &&
        !/^(fall|spring|summer|winter|autumn|term)\b/i.test(p),
    );

    const termIdx = rest.findIndex((p) => /^(fall|spring|summer|winter|autumn)/i.test(p) || /^(19|20)\d{2}$/.test(p));

    // Prefer the text peeled off the code field, then fall back to other fields.
    const titleCandidate = (titleLeftover || titleParts.join(" ")).replace(/\s+/g, " ").trim();
    const title = titleCandidate
      .replace(/\b(19|20)\d{2}\b/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    courses.push({
      id: `t${courses.length}-${dedupe}`,
      code,
      title: title.length > 2 ? title.slice(0, 80) : "Untitled course",
      credits: Math.round(credits * 10) / 10,
      grade,
      gradeLetter: grade === null ? null : pointToLetter(grade),
      term: termIdx >= 0 ? rest[termIdx] : undefined,
      subject: inferSubject(code, title),
    });
    seen.add(dedupe);
  }

  return courses;
}

/* -------------------------------------------------------- aggregation */

export function summariseTranscript(courses: TranscriptCourse[]): Transcript {
  let creditsAttempted = 0;
  let qualityPoints = 0;
  let creditsEarned = 0;
  let creditsStrong = 0;
  let currentTermCredits = 0;

  for (const c of courses) {
    if (c.grade === null) {
      // In-progress work is neither attempted nor earned — it is pending.
      currentTermCredits += c.credits;
      continue;
    }
    creditsAttempted += c.credits;
    qualityPoints += c.grade * c.credits;
    // A failing grade still counts as attempted (it is in the GPA denominator)
    // but it is not earned credit and cannot satisfy a prerequisite.
    if (c.grade > 0) creditsEarned += c.credits;
    if (c.grade >= 2) creditsStrong += c.credits;
  }

  // All stored grade points are already normalised to a 4.0 scale, so the
  // denominator is graded credits attempted and the ceiling is always 4.0.
  const gpa = creditsAttempted > 0 ? qualityPoints / creditsAttempted : 0;

  return {
    courses,
    gpa: Number(gpa.toFixed(3)),
    creditsAttempted: round(creditsAttempted),
    creditsEarned: round(creditsEarned),
    creditsStrong: round(creditsStrong),
    scaleMax: 4,
    currentTermCredits: round(currentTermCredits),
  };
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Per-subject averages, used to show where a student's marks actually cluster. */
export function subjectStrengths(courses: TranscriptCourse[]): { tag: SubjectTag; average: number; count: number }[] {
  const buckets = new Map<SubjectTag, { points: number; credits: number; count: number }>();

  for (const c of courses) {
    if (c.grade === null) continue;
    const b = buckets.get(c.subject) ?? { points: 0, credits: 0, count: 0 };
    b.points += c.grade * c.credits;
    b.credits += c.credits;
    b.count += 1;
    buckets.set(c.subject, b);
  }

  return [...buckets.entries()]
    .map(([tag, b]) => ({ tag, average: Number((b.points / b.credits).toFixed(2)), count: b.count }))
    .sort((a, b) => b.average - a.average);
}

/**
 * Prefixes that are routinely used interchangeably across institutions, mapped
 * to a single canonical form. This must be a one-way canonicalisation: a
 * two-way map (CH -> CHEM, CHEM -> CH) would leave the two sides of a
 * cross-listed pair comparing unequal.
 */
const CROSS_LISTED: Record<string, string> = {
  // chemistry
  CH: "CHEM",
  // mathematics / statistics
  MA: "MATH",
  MAT: "MATH",
  ST: "MATH",
  STAT: "MATH",
  STATS: "MATH",
  STATI: "MATH",
  // physics
  PHY: "PHYS",
  // computing
  COMP: "CS",
  SC: "CS",
  CSCI: "CS",
  CSIT: "CS",
  CMPT: "CS",
  CSC: "CS",
  // engineering
  ENGR: "ENG",
  ELEC: "EE",
  ECE: "EE",
  // life sciences
  BIOL: "BIO",
  BIOLAB: "BIO",
  ECOL: "BIO",
  // behavioural / social
  PSY: "PSYCH",
  POLI: "POL",
  PSCI: "POL",
  // writing / literature
  WRIT: "ENGL",
};

/** Collapse a subject prefix to a canonical form for looser comparisons. */
export function canonicalPrefix(code: string): string {
  const p = codePrefix(code);
  return CROSS_LISTED[p] ?? p;
}

/**
 * Best-fit matching of a taken course to a catalogue requirement.
 *
 * `exact` means the same subject prefix and the same course number. `partial`
 * is deliberately narrow: a shared course number across unrelated subjects
 * (MATH 140 vs CS 140) is NOT a match, because treating it as one would let a
 * single course satisfy requirements in two different departments.
 */
export function matchCourse(taken: TranscriptCourse, requiredCode: string): { exact: boolean; partial: boolean } {
  const takenCode = normalizeCode(taken.code);
  const reqCode = normalizeCode(requiredCode);
  if (takenCode === reqCode) return { exact: true, partial: false };

  const takenNum = takenCode.match(/(\d{1,4}[A-Z]?)\s*$/);
  const reqNum = reqCode.match(/(\d{1,4}[A-Z]?)\s*$/);
  if (!takenNum || !reqNum) return { exact: false, partial: false };

  if (takenNum[1] !== reqNum[1]) return { exact: false, partial: false };

  const takenPrefix = canonicalPrefix(takenCode);
  const reqPrefix = canonicalPrefix(reqCode);
  if (takenPrefix && takenPrefix === reqPrefix) return { exact: false, partial: true };

  return { exact: false, partial: false };
}