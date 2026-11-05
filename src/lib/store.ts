"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Aspiration,
  DistressSignal,
  InterestVector,
  Phase,
  RecommendationReport,
  Transcript,
  TranscriptCourse,
} from "@/lib/types";
import { DEFAULT_PRIORITIES } from "@/lib/types";
import { deriveGradSchoolAppetite, deriveInterests, deriveOptionalityBias, deriveWorkloadTolerance, type QuizAnswers } from "@/lib/interests";
import { detectDistress } from "@/lib/distress";
import { parseTranscriptText, summariseTranscript } from "@/lib/transcript";
import { id } from "@/lib/utils";

/**
 * Client-side session store.
 *
 * PRIVACY: the transcript is an academic record protected by FERPA in the US.
 * It is parsed, aggregated and scored entirely in the browser and is never
 * included in any request to our own API. What crosses the wire to the server
 * is only department IDs, and that is only for market lookups keyed by an
 * occupation code — there is no student identifier in the request at all.
 */
interface AdvisorState {
  /* phase machine */
  phase: Phase;
  maxPhaseReached: Phase;

  /* phase 1 */
  transcriptText: string;
  courses: TranscriptCourse[];
  transcript: Transcript;
  transcriptDirty: boolean;

  /* phase 2 */
  answers: QuizAnswers;
  interests: InterestVector;
  workStyles: Aspiration["workStyles"];
  targetRoles: string[];
  environment: Aspiration["environment"];
  workloadTolerance: number;
  optionalityBias: number;
  gradSchoolAppetite: number;
  priorities: Aspiration["priorities"];
  dayInLife: string;

  /* phase 5 */
  report: RecommendationReport | null;
  reportLoading: boolean;

  /* guardrail */
  distress: DistressSignal;
  distressAcknowledged: boolean;
  /**
   * Phase cap captured the moment an unacknowledged distress pause fires, so
   * acknowledging the banner can hand the full navigation range straight back
   * instead of leaving the student stranded on the phase they were in.
   */
  pausedFromPhase: Phase | null;

  /* actions */
  setPhase: (p: Phase) => void;
  setTranscriptText: (text: string) => void;
  setCourses: (courses: TranscriptCourse[]) => void;
  addCourse: (course: TranscriptCourse) => void;
  updateCourse: (courseId: string, patch: Partial<TranscriptCourse>) => void;
  removeCourse: (courseId: string) => void;
  loadSampleTranscript: () => void;

  setAnswer: (questionId: string, optionId: string) => void;
  setAnswers: (questionId: string, optionIds: string[]) => void;
  recomputeInterests: () => void;
  setTargetRoles: (ids: string[]) => void;
  setWorkStyles: (styles: Aspiration["workStyles"]) => void;
  setEnvironment: (env: Aspiration["environment"]) => void;
  setWorkloadTolerance: (n: number) => void;
  setOptionalityBias: (n: number) => void;
  setGradSchoolAppetite: (n: number) => void;
  setPriority: (id: string, weight: number) => void;
  setDayInLife: (text: string) => void;

  setReport: (r: RecommendationReport | null) => void;
  setReportLoading: (v: boolean) => void;

  checkDistress: (text: string) => DistressSignal;
  acknowledgeDistress: () => void;

  reset: () => void;
  resetEverything: () => void;
}

const EMPTY_INTERESTS: InterestVector = {
  computation: 0,
  quantitative: 0,
  lifeScience: 0,
  physicalSystem: 0,
  humanBehavior: 0,
  creativeExpression: 0,
  societalImpact: 0,
  leadership: 0,
};

const EMPTY_TRANSCRIPT: Transcript = {
  courses: [],
  gpa: 0,
  creditsAttempted: 0,
  creditsEarned: 0,
  creditsStrong: 0,
  scaleMax: 4,
  currentTermCredits: 0,
};

const SAMPLE = `MATH 140 Calculus I, 4, A
MATH 141 Calculus II, 4, B+
MATH 240 Linear Algebra, 3, A-
STAT 310 Probability & Statistics, 3, B+
CS 101 Introduction to Programming, 4, A
CS 201 Data Structures & Algorithms, 4, B
PHYS 201 University Physics I, 4, B-
CHEM 201 Organic Chemistry I, 4, C
ECON 150 Microeconomic Theory, 3, A-
ENGL 210 Academic Writing, 3, B
PHIL 150 Logic & Reasoning, 3, A`;

/**
 * Fresh state factory. Returning a new object each call keeps the reset paths
 * from handing out shared nested references that could later be mutated in
 * place.
 */
const initialState = () => ({
  phase: 1 as Phase,
  maxPhaseReached: 1 as Phase,
  transcriptText: "",
  courses: [] as TranscriptCourse[],
  transcript: { ...EMPTY_TRANSCRIPT, courses: [] },
  transcriptDirty: false,
  answers: {} as QuizAnswers,
  interests: { ...EMPTY_INTERESTS },
  workStyles: [] as Aspiration["workStyles"],
  targetRoles: [] as string[],
  environment: "undecided" as Aspiration["environment"],
  workloadTolerance: 50,
  optionalityBias: 50,
  gradSchoolAppetite: 35,
  priorities: DEFAULT_PRIORITIES.map((p) => ({ ...p })),
  dayInLife: "",
  report: null,
  reportLoading: false,
  distress: { detected: false, severity: "none", matchedPhrases: [], resources: [] } as DistressSignal,
  distressAcknowledged: false,
  pausedFromPhase: null as Phase | null,
});

export const useAdvisor = create<AdvisorState>()(
  persist(
    (set, get) => ({
      ...initialState(),

      setPhase: (p) =>
        set((s) => ({
          phase: p,
          maxPhaseReached: Math.max(s.maxPhaseReached, p) as Phase,
        })),

      setTranscriptText: (text) => set({ transcriptText: text }),

      setCourses: (courses) =>
        set({ courses, transcript: summariseTranscript(courses), transcriptDirty: true }),

      addCourse: (course) =>
        set((s) => {
          const courses = [...s.courses, { ...course, id: course.id || id() }];
          return { courses, transcript: summariseTranscript(courses), transcriptDirty: true };
        }),

      updateCourse: (courseId, patch) =>
        set((s) => {
          const courses = s.courses.map((c) => (c.id === courseId ? { ...c, ...patch } : c));
          return { courses, transcript: summariseTranscript(courses), transcriptDirty: true };
        }),

      removeCourse: (courseId) =>
        set((s) => {
          const courses = s.courses.filter((c) => c.id !== courseId);
          return { courses, transcript: summariseTranscript(courses), transcriptDirty: true };
        }),

      loadSampleTranscript: () => {
        const courses = parseTranscriptText(SAMPLE);
        set({ transcriptText: SAMPLE, courses, transcript: summariseTranscript(courses), transcriptDirty: true });
      },

      setAnswer: (questionId, optionId) => {
        const s = get();
        set({ answers: { ...s.answers, [questionId]: [optionId] } });
        get().recomputeInterests();
      },

      setAnswers: (questionId, optionIds) => {
        const s = get();
        set({ answers: { ...s.answers, [questionId]: optionIds } });
        get().recomputeInterests();
      },

      recomputeInterests: () => {
        const { answers } = get();
        set({
          interests: deriveInterests(answers),
          workloadTolerance: deriveWorkloadTolerance(answers),
          optionalityBias: deriveOptionalityBias(answers),
          gradSchoolAppetite: deriveGradSchoolAppetite(answers),
        });
      },

      setTargetRoles: (ids) => set({ targetRoles: ids }),
      setWorkStyles: (styles) => set({ workStyles: styles }),
      setEnvironment: (env) => set({ environment: env }),
      setWorkloadTolerance: (n) => set({ workloadTolerance: n }),
      setOptionalityBias: (n) => set({ optionalityBias: n }),
      setGradSchoolAppetite: (n) => set({ gradSchoolAppetite: n }),
      setPriority: (pid, weight) =>
        set((s) => ({ priorities: s.priorities.map((p) => (p.id === pid ? { ...p, weight } : p)) })),
      setDayInLife: (text) => set({ dayInLife: text }),

      setReport: (r) => set({ report: r }),
      setReportLoading: (v) => set({ reportLoading: v }),

      checkDistress: (text) => {
        const signal = detectDistress(text);
        if (signal.detected) {
          set((s) => ({
            distress: signal,
            distressAcknowledged: false,
            // Guardrail: pause forward navigation while the banner is up. The
            // cap is remembered so acknowledging it restores the exact range
            // the student had already earned, wherever they were.
            pausedFromPhase: s.pausedFromPhase ?? s.maxPhaseReached,
            maxPhaseReached: Math.min(s.maxPhaseReached, s.phase) as Phase,
          }));
        }
        return signal;
      },

      acknowledgeDistress: () =>
        set((s) => ({
          distressAcknowledged: true,
          // "I'm okay, continue" has to release the pause; leaving `detected`
          // true kept every Continue / Generate button disabled forever.
          distress: { ...s.distress, detected: false },
          maxPhaseReached: s.pausedFromPhase ?? s.maxPhaseReached,
          pausedFromPhase: null,
        })),

      reset: () => set(initialState()),

      resetEverything: () => set(initialState()),
    }),
    {
      name: "dsg-session-v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (s) => ({
        phase: s.phase,
        maxPhaseReached: s.maxPhaseReached,
        transcriptText: s.transcriptText,
        courses: s.courses,
        transcript: s.transcript,
        answers: s.answers,
        interests: s.interests,
        workStyles: s.workStyles,
        targetRoles: s.targetRoles,
        environment: s.environment,
        workloadTolerance: s.workloadTolerance,
        optionalityBias: s.optionalityBias,
        gradSchoolAppetite: s.gradSchoolAppetite,
        priorities: s.priorities,
        dayInLife: s.dayInLife,
        report: s.report,
      }),
    },
  ),
);

/** True once the persisted session has been read back into memory. */
export function hasHydrated(): boolean {
  return useAdvisor.persist.hasHydrated();
}

/** Subscribe to the end of rehydration, for SSR-safe client rendering. */
export function onHydrated(cb: () => void): () => void {
  if (useAdvisor.persist.hasHydrated()) {
    cb();
    return () => {};
  }
  return useAdvisor.persist.onFinishHydration(() => cb());
}

/**
 * The flat Phase 2 state fields assembled into the single `Aspiration` object
 * the scoring and analysis layers expect. Kept as a hook rather than derived
 * state so there is exactly one definition of "what the student wants".
 */
export function useAspiration(): Aspiration {
  const targetRoles = useAdvisor((s) => s.targetRoles);
  const workStyles = useAdvisor((s) => s.workStyles);
  const environment = useAdvisor((s) => s.environment);
  const workloadTolerance = useAdvisor((s) => s.workloadTolerance);
  const optionalityBias = useAdvisor((s) => s.optionalityBias);
  const gradSchoolAppetite = useAdvisor((s) => s.gradSchoolAppetite);
  const dayInLife = useAdvisor((s) => s.dayInLife);
  const priorities = useAdvisor((s) => s.priorities);

  return { targetRoles, workStyles, environment, workloadTolerance, optionalityBias, gradSchoolAppetite, dayInLife, priorities };
}