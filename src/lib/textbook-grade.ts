// Grading a finished textbook lesson. Used by the server, which re-checks every answer itself,
// and by the browser to know when the lesson is finished.

import { isRight, type BookProblem, type TextbookLesson } from "./textbook-lesson";

/** Tries per problem; after this the solution shows. */
export const MAX_TRIES = 3;
/** Points: right on the first try, right on a later try. */
export const FIRST_TRY_POINTS = 1;
export const LATER_TRY_POINTS = 0.5;

/** The problems a lesson is graded on: its worksheet, or its Try Its when it has no worksheet. */
export function gradedProblems(l: TextbookLesson): BookProblem[] {
  return l.worksheet.length ? l.worksheet : l.parts.flatMap((p) => p.try_it);
}

/** Which kind of problem is graded, so the browser knows which answers to send. */
export const gradesWorksheet = (l: TextbookLesson) => l.worksheet.length > 0;

export interface ProblemGrade { tried: string[]; right: boolean; points: number }
export interface LessonGrade { score: number; points: number; total: number; problems: ProblemGrade[] }

/**
 * Grades the answers a student tried for each graded problem (in order, up to 3 each). A problem
 * earns 1 point if the first answer is right, 0.5 if a later one is, 0 otherwise. Returns null if
 * the answers don't match the lesson's problems.
 */
export function gradeLesson(l: TextbookLesson, responses: unknown): LessonGrade | null {
  const problems = gradedProblems(l);
  if (!problems.length || !Array.isArray(responses) || responses.length !== problems.length) return null;
  const graded: ProblemGrade[] = [];
  for (let i = 0; i < problems.length; i++) {
    const r = responses[i];
    if (!Array.isArray(r)) return null;
    const tried = r.filter((x): x is string => typeof x === "string").map((x) => x.slice(0, 200)).slice(0, MAX_TRIES);
    const at = tried.findIndex((x) => isRight(problems[i], x));
    const points = at === 0 ? FIRST_TRY_POINTS : at > 0 ? LATER_TRY_POINTS : 0;
    // Answers after the right one don't count
    graded.push({ tried: at >= 0 ? tried.slice(0, at + 1) : tried, right: at >= 0, points });
  }
  const points = graded.reduce((s, g) => s + g.points, 0);
  return { score: Math.round((points / problems.length) * 100), points, total: problems.length, problems: graded };
}
