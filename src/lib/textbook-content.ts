// Server-only: the pre-written textbook lessons in content/textbook/<skill id>.json. A skill
// without one falls back to its shorter generated lesson (quest_lessons) until it's written.

import type { TextbookLesson } from "./textbook-lesson";

const SAFE_ID = /^[a-z0-9.-]+$/i;

/** The pre-written lesson for a skill, or null if it hasn't been written yet. */
export async function prewrittenLesson(skillId: string): Promise<TextbookLesson | null> {
  if (!SAFE_ID.test(skillId)) return null;
  try {
    const mod = await import(`../../content/textbook/${skillId}.json`);
    return (mod.default ?? mod) as TextbookLesson;
  } catch {
    return null;
  }
}
