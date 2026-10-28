// Mastery tracking with Bayesian Knowledge Tracing (BKT).
// For each student and skill we keep p_known: the probability they've mastered it.
// After each answer we update it, allowing for lucky guesses and careless slips,
// then add the chance they learned from the practice itself.

export const P_LEARN = 0.15;   // chance of learning the skill from one practice question
export const P_SLIP = 0.1;     // chance a student who knows it still gets it wrong
export const P_GUESS = { multiple_choice: 0.25, numeric: 0.1 } as const;

export const MASTERED_AT = 0.95;   // p_known needed to count as mastered
export const MIN_ATTEMPTS_FOR_MASTERY = 3;
export const GAP_BELOW = 0.5;      // below this, the skill is a weak spot

/** Days until the next review after each successful review step. */
export const REVIEW_INTERVAL_DAYS = [1, 3, 7, 21];

export function updatePKnown(pKnown: number, correct: boolean, kind: "multiple_choice" | "numeric"): number {
  const guess = P_GUESS[kind];
  const posterior = correct
    ? (pKnown * (1 - P_SLIP)) / (pKnown * (1 - P_SLIP) + (1 - pKnown) * guess)
    : (pKnown * P_SLIP) / (pKnown * P_SLIP + (1 - pKnown) * (1 - guess));
  const next = posterior + (1 - posterior) * P_LEARN;
  return Math.min(0.999, Math.max(0.001, next));
}

export type SkillStatus = "mastered" | "developing" | "gap" | "not_started";

export function statusOf(pKnown: number | null | undefined, attempts = 0): SkillStatus {
  if (pKnown === null || pKnown === undefined) return "not_started";
  if (pKnown >= MASTERED_AT && attempts >= MIN_ATTEMPTS_FOR_MASTERY) return "mastered";
  if (pKnown < GAP_BELOW) return "gap";
  return "developing";
}

/** Starting estimate from the diagnostic, before any practice. */
export function diagnosticPrior(result: "correct" | "wrong" | "inferred_known" | "inferred_unsure", difficulty = 2): number {
  switch (result) {
    case "correct": return difficulty >= 3 ? 0.8 : 0.7;
    case "wrong": return 0.15;
    case "inferred_known": return 0.7;   // a harder skill that builds on it was answered correctly
    case "inferred_unsure": return 0.4;  // not tested directly
  }
}

export function nextReviewDate(step: number, from = new Date()): Date {
  const days = REVIEW_INTERVAL_DAYS[Math.min(step, REVIEW_INTERVAL_DAYS.length - 1)];
  return new Date(from.getTime() + days * 86_400_000);
}
