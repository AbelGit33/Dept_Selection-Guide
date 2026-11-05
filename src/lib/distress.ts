import type { DistressSignal } from "@/lib/types";
import { DISTRESS_PATTERNS, WELLNESS_RESOURCES } from "@/lib/data/quiz";

/**
 * Guardrail: detect acute academic distress in free-text input and pause the
 * workflow in favour of campus resources.
 *
 * Deliberately conservative and transparent. Every pattern that fires is
 * surfaced to the user rather than acting silently, because a false positive
 * that just shows extra resources is harmless while a missed one is not.
 */
export function detectDistress(input: string): DistressSignal {
  if (!input || input.trim().length < 3) {
    return { detected: false, severity: "none", matchedPhrases: [], resources: [] };
  }

  const matchedPhrases: string[] = [];
  let score = 0;

  for (const { re, weight } of DISTRESS_PATTERNS) {
    const m = input.match(re);
    if (m) {
      score += weight;
      matchedPhrases.push(m[0].toLowerCase().trim());
    }
  }

  if (score === 0) {
    return { detected: false, severity: "none", matchedPhrases: [], resources: [] };
  }

  // A single mild phrase is almost always ordinary frustration.
  const severity: DistressSignal["severity"] =
    score >= 7 ? "acute" : score >= 4 ? "moderate" : score >= 2 ? "mild" : "mild";

  return {
    detected: true,
    severity,
    matchedPhrases,
    resources: WELLNESS_RESOURCES,
  };
}

export { WELLNESS_RESOURCES };