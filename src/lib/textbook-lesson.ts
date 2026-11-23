// The shape of a pre-written textbook lesson (see docs/textbook-research.md for why it's built
// this way). Shared by the browser (the book), the server (the mentor) and the pre-writing script.

import { checkAnswer } from "./quest/answers";
import type { LessonContent } from "./quest/lesson-types";

/** A question the app checks: a Try It, a warm-up or a worksheet problem. */
export interface BookProblem {
  question: string;
  kind: "numeric" | "multiple_choice";
  /** Multiple choice only: 3–4 choices, one of them equal to `answer`. */
  choices?: string[];
  /** A single number (fractions allowed), or for multiple choice the correct choice's text. */
  answer: string;
  /** Two hints: a gentle nudge, then a more specific one. */
  hints: string[];
  /** The worked solution, shown after the student tries. */
  solution: string[];
  /** Likely wrong answers and feedback naming the mistake behind each. */
  wrong: { answer: string; feedback: string }[];
}

export type WorksheetLevel = "practice" | "apply" | "think" | "review" | "challenge";
export interface WorksheetProblem extends BookProblem { level: WorksheetLevel }

export interface BookStep { say: string; why: string }

export interface BookPart {
  heading: string;
  read: string[];
  /** A small table (ratio table, place-value chart…), first row is the header. */
  model: { caption: string; rows: string[][] } | null;
  example: { problem: string; steps: BookStep[]; answer: string };
  try_it: BookProblem[];
  /** What the mentor says on this part's pages. */
  mentor: string;
}

export interface TextbookLesson {
  version: 2;
  skill_id: string;
  title: string;
  hook: string;
  goal: string;
  vocabulary: { term: string; meaning: string; example: string }[];
  warm_up: BookProblem[];
  parts: BookPart[];
  mistake: { problem: string; work: string[]; what_went_wrong: string; fix: string };
  summary: string[];
  faith: string | null;
  worksheet: WorksheetProblem[];
}

export const WORKSHEET_LEVELS: Record<WorksheetLevel, string> = {
  practice: "Practice", apply: "Apply it", think: "Think about it", review: "Review", challenge: "Challenge",
};

/** Is this response right? Numbers match in any equal form (3/4 = 0.75). */
export function isRight(p: Pick<BookProblem, "kind" | "choices" | "answer">, response: string): boolean {
  if (p.kind === "multiple_choice") return response.trim() === p.answer.trim();
  return checkAnswer({ kind: "numeric", choices: null, answer: p.answer }, response).correct;
}

/** The feedback for a known wrong answer, if the response is one. */
export function feedbackFor(p: BookProblem, response: string): string | null {
  const hit = p.wrong.find((w) => (p.kind === "multiple_choice"
    ? w.answer.trim() === response.trim()
    : checkAnswer({ kind: "numeric", choices: null, answer: w.answer }, response).correct));
  return hit?.feedback ?? null;
}

/** Problems in a lesson whose format can't work (used by the pre-writing script and tests). */
export function lessonProblems(l: TextbookLesson): string[] {
  const issues: string[] = [];
  const checkProblem = (p: BookProblem, where: string) => {
    if (!p.question.trim()) issues.push(`${where}: no question`);
    if (p.hints.length < 1) issues.push(`${where}: needs hints`);
    if (p.solution.length < 1) issues.push(`${where}: needs a solution`);
    if (p.kind === "multiple_choice") {
      if (!p.choices || p.choices.length < 3 || p.choices.length > 4) issues.push(`${where}: multiple choice needs 3–4 choices`);
      else if (p.choices.filter((c) => c.trim() === p.answer.trim()).length !== 1) issues.push(`${where}: the answer must be exactly one of the choices`);
    } else if (!isRight(p, p.answer) || !/\d/.test(p.answer)) {
      issues.push(`${where}: the answer "${p.answer}" must be a single number`);
    }
    for (const w of p.wrong) if (isRight(p, w.answer)) issues.push(`${where}: the wrong answer "${w.answer}" is actually right`);
  };
  if (l.parts.length < 2 || l.parts.length > 4) issues.push("needs 2–4 parts");
  l.warm_up.forEach((p, i) => checkProblem(p, `Warm-up ${i + 1}`));
  l.parts.forEach((part, i) => {
    if (!part.read.length) issues.push(`Part ${i + 1}: nothing to read`);
    if (part.example.steps.length < 2) issues.push(`Part ${i + 1}: the example needs steps`);
    if (!part.try_it.length) issues.push(`Part ${i + 1}: needs a Try It`);
    part.try_it.forEach((p, j) => checkProblem(p, `Part ${i + 1} Try It ${j + 1}`));
  });
  if (l.worksheet.length < 8) issues.push("the worksheet needs at least 8 problems");
  l.worksheet.forEach((p, i) => checkProblem(p, `Worksheet ${i + 1}`));
  return issues;
}

/** Every checkable problem in order, with a label (for the blind solve). */
export function allProblems(l: TextbookLesson): { label: string; problem: BookProblem }[] {
  return [
    ...l.warm_up.map((problem, i) => ({ label: `Warm-up ${i + 1}`, problem })),
    ...l.parts.flatMap((part, i) => part.try_it.map((problem, j) => ({ label: `Part ${i + 1} Try It ${j + 1}`, problem }))),
    ...l.worksheet.map((problem, i) => ({ label: `Worksheet ${i + 1}`, problem })),
  ];
}

/**
 * The lesson as text for the mentor. Questions are included so the mentor can help with them,
 * but answers aren't, so it can't hand them out.
 */
export function bookAsText(l: TextbookLesson): string {
  const q = (p: BookProblem) => p.question + (p.choices ? ` (choices: ${p.choices.join(" | ")})` : "");
  return [
    `${l.title}. Goal: ${l.goal}`, l.hook,
    l.vocabulary.map((v) => `${v.term}: ${v.meaning} (${v.example})`).join("\n"),
    ...l.parts.map((p, i) => [
      `Part ${i + 1}: ${p.heading}`, ...p.read,
      p.model ? `${p.model.caption}\n${p.model.rows.map((r) => r.join(" | ")).join("\n")}` : "",
      `Example: ${p.example.problem}\n${p.example.steps.map((s, j) => `${j + 1}. ${s.say} (${s.why})`).join("\n")}\nAnswer: ${p.example.answer}`,
      ...p.try_it.map((t, j) => `Try It ${i + 1}.${j + 1} (don't give the answer away): ${q(t)}`),
    ].filter(Boolean).join("\n")),
    `Spot the mistake: ${l.mistake.problem}\n${l.mistake.work.join("\n")}\nWhat went wrong: ${l.mistake.what_went_wrong}\nFix: ${l.mistake.fix}`,
    `Key ideas: ${l.summary.join(" ")}`,
    `Worksheet (don't give answers away):\n${l.worksheet.map((w, i) => `${i + 1}. ${q(w)}`).join("\n")}`,
  ].filter(Boolean).join("\n\n").slice(0, 12000);
}

/** An older, shorter lesson shown in the new book layout until its pre-written lesson exists. */
export function fromShortLesson(skillId: string, l: LessonContent): TextbookLesson {
  const steps = (s: string[]) => s.map((say) => ({ say, why: "" }));
  return {
    version: 2, skill_id: skillId, title: l.title, hook: l.why, goal: `I can ${l.title.toLowerCase()}.`,
    vocabulary: l.vocabulary.map((v) => ({ ...v, example: "" })),
    warm_up: [],
    parts: l.examples.map((e, i) => ({
      heading: i === 0 ? "The big idea" : "Try a harder one",
      read: i === 0 ? l.explain : [],
      model: null,
      example: { problem: e.problem, steps: steps(e.steps), answer: e.answer },
      try_it: i === l.examples.length - 1
        ? [{ question: l.check.question, kind: "numeric" as const, answer: l.check.answer, hints: [l.check.hint], solution: [`The answer is ${l.check.answer}.`], wrong: [] }]
        : [],
      mentor: i === 0 ? "Here's the big idea. Read it with me, then we'll look at an example." : "This one is a little harder. One step at a time.",
    })),
    mistake: { problem: "", work: [], what_went_wrong: l.watch_out, fix: "" },
    summary: [], faith: l.faith, worksheet: [],
  };
}
