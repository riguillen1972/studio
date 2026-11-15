// Kept for the pages that already import it; the phrase list now lives in src/lib/safety.ts.
import { detectConcern } from "@/lib/safety";

export function isCrisis(text: string): boolean {
  return detectConcern(text) !== null;
}
