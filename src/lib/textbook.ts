// How the Math Textbook is organized: each grade is a book, each NAD topic is a unit, and each
// unit is split evenly into chapters of up to 4 lessons (one lesson per skill). Chapters are
// numbered straight through the grade's book. Within a unit, ★ challenge lessons come last.

import { SKILLS_BY_ID, TOPICS_BY_SECTION, sectionOf } from "./quest/skills";

export const LESSONS_PER_CHAPTER = 4;

export interface Chapter { number: number; part: number; parts: number; skillIds: string[] }
export interface Unit { letter: string; title: string; nad: string; chapters: Chapter[] }

/** Splits a list into as few groups of up to `size` as possible, as evenly as possible (10 → 4, 3, 3). */
function evenChunks<T>(items: T[], size: number): T[][] {
  const count = Math.max(1, Math.ceil(items.length / size));
  const chunks: T[][] = [];
  let start = 0;
  for (let i = 0; i < count; i++) {
    const len = Math.ceil((items.length - start) / (count - i));
    chunks.push(items.slice(start, start + len));
    start += len;
  }
  return chunks;
}

/** The units and chapters of one grade's book. */
export function textbookUnits(grade: number): Unit[] {
  let number = 0;
  return (TOPICS_BY_SECTION[grade] ?? []).map((t) => {
    // Regular lessons first, then the ★ challenge lessons, so each unit gets harder as it goes
    const ordered = [...t.skillIds.filter((id) => !SKILLS_BY_ID[id]?.advanced), ...t.skillIds.filter((id) => SKILLS_BY_ID[id]?.advanced)];
    const groups = evenChunks(ordered, LESSONS_PER_CHAPTER);
    return {
      letter: t.letter, title: t.title, nad: t.nad,
      chapters: groups.map((skillIds, i) => ({ number: ++number, part: i + 1, parts: groups.length, skillIds })),
    };
  });
}

/** Where a lesson sits in the book, plus the lessons before and after it in that grade. */
export function lessonPlace(skillId: string) {
  const skill = SKILLS_BY_ID[skillId];
  if (!skill) return null;
  const grade = sectionOf(skill);
  const units = textbookUnits(grade);
  const order = units.flatMap((u) => u.chapters.flatMap((c) => c.skillIds));
  const at = order.indexOf(skillId);
  for (const unit of units) {
    const chapter = unit.chapters.find((c) => c.skillIds.includes(skillId));
    if (chapter) return { grade, unit, chapter, lessonInChapter: chapter.skillIds.indexOf(skillId) + 1, prevId: order[at - 1], nextId: order[at + 1] };
  }
  return null;
}
