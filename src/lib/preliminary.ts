import type { Aspiration, DepartmentScore, InterestVector, MarketSnapshot, Transcript } from "@/lib/types";
import { DEPARTMENTS } from "@/lib/data/departments";
import { deriveWeights, scoreDepartment, type Weights } from "@/lib/scoring";

/**
 * A deliberately neutral market snapshot so Phase 3 can rank departments on
 * academic fit, interest and prerequisites alone — before the labour-market
 * fetch happens. Every market field sits at the catalogue median so it cannot
 * accidentally influence the ordering.
 */
export const NEUTRAL_MARKET: MarketSnapshot = {
  fetchedAt: new Date(0).toISOString(),
  source: "seed",
  seriesId: "not-yet-fetched",
  metrics: {
    medianSalary: 75_000,
    salaryP25: 52_000,
    salaryP75: 110_000,
    projectedGrowth: 5,
    placementRate: 0.85,
    demandIndex: 50,
    skillDemand: 50,
    automationExposure: 45,
    sampleSize: 100_000,
  },
  provenance: "Market not yet fetched — Phase 3 ranks on academic fit, interest and prerequisites only.",
};

/** Weight set with the market component removed and its share redistributed. */
export function weightsWithoutMarket(base: Weights): Weights {
  const { market, ...rest } = base;
  const total = 1 - market;
  if (total <= 0) return base;
  return {
    academic: rest.academic / total,
    interest: rest.interest / total,
    career: rest.career / total,
    feasibility: rest.feasibility / total,
    market: 0,
  };
}

export interface PreliminaryRow {
  score: number;
  feasibility: DepartmentScore["feasibility"];
  interest: number;
  academic: number;
  career: number;
}

/**
 * Phase 3 ranking. Excludes market data entirely so students see how their
 * prerequisites and academic history stand on their own before any pay
 * figures can bias the picture.
 */
export function rankPreliminary(args: {
  transcript: Transcript;
  interests: InterestVector;
  aspiration: Aspiration;
  only?: string[];
  limit?: number;
}): PreliminaryRow[] {
  const { transcript, interests, aspiration, only, limit = 10 } = args;
  const pool = only?.length ? DEPARTMENTS.filter((d) => only.includes(d.id)) : DEPARTMENTS;
  const weights = weightsWithoutMarket(deriveWeights(aspiration));

  return pool
    .map((department) => {
      const scored = scoreDepartment({
        department,
        transcript,
        interests,
        aspiration,
        market: NEUTRAL_MARKET,
        weights,
      });
      const byKey = (k: string) => scored.components.find((c) => c.key === k)?.value ?? 0;
      return {
        score: scored.total,
        feasibility: scored.feasibility,
        interest: byKey("interest"),
        academic: byKey("academic"),
        career: byKey("career"),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}