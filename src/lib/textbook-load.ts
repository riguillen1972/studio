// Server-only: the lesson a student sees for a skill, in the book format: the pre-written lesson,
// or the shorter generated one converted. Null when neither exists or the teacher hid it.

import { getAdminClient } from "./usage";
import { prewrittenLesson } from "./textbook-content";
import { fromShortLesson, type TextbookLesson } from "./textbook-lesson";
import type { LessonContent } from "./quest/lesson-types";

export async function lessonForStudent(skillId: string): Promise<TextbookLesson | null> {
  const [book, { data: row }] = await Promise.all([
    prewrittenLesson(skillId),
    getAdminClient().from("quest_lessons").select("content, status").eq("skill_id", skillId).maybeSingle(),
  ]);
  if (row?.status === "hidden") return null;
  if (book) return book;
  return row?.status === "approved" ? fromShortLesson(skillId, row.content as LessonContent) : null;
}
