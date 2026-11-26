import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { gradeLesson, gradedProblems } from "../src/lib/textbook-grade";
import type { BookProblem, TextbookLesson } from "../src/lib/textbook-lesson";

const modelLesson = JSON.parse(
  readFileSync(path.join(process.cwd(), "content/textbook/6.long-division.json"), "utf8"),
) as TextbookLesson;

const rightAnswer = (p: BookProblem) => p.answer;

const wrongAnswer = (p: BookProblem) =>
  p.kind === "multiple_choice"
    ? p.choices!.find((c) => c !== p.answer)!
    : "-999";

test("gradedProblems returns worksheet when non-empty and all Try Its in order when worksheet is empty", () => {
  assert.deepEqual(gradedProblems(modelLesson), modelLesson.worksheet);

  const noWorksheet = structuredClone(modelLesson);
  noWorksheet.worksheet = [];
  const expectedTryIts = noWorksheet.parts.flatMap((part) => part.try_it);
  assert.equal(expectedTryIts.length > 0, true);
  assert.deepEqual(gradedProblems(noWorksheet), expectedTryIts);
});

test("gradeLesson returns score 100 when every problem is answered right on the first try", () => {
  const problems = gradedProblems(modelLesson);
  const responses = problems.map((p) => [rightAnswer(p)]);

  const grade = gradeLesson(modelLesson, responses);
  assert.ok(grade !== null);
  assert.equal(grade.score, 100);
  assert.equal(grade.points, problems.length);
  assert.equal(grade.total, problems.length);
  assert.equal(grade.problems.every((g) => g.right && g.points === 1), true);
});

test("gradeLesson awards 0.5 for 2nd-try right, 0 for never right, and rounds non-integer scores", () => {
  const problems = gradedProblems(modelLesson);
  assert.equal(problems.length, 11);

  // 9 first-try right (9), 1 second-try right (0.5), 1 never right (0) => 9.5 / 11 * 100 = 86.363... -> 86
  const responses = problems.map((p, i) => {
    if (i === 0) return [wrongAnswer(p), rightAnswer(p)];
    if (i === 1) return [wrongAnswer(p), wrongAnswer(p), wrongAnswer(p)];
    return [rightAnswer(p)];
  });

  const grade = gradeLesson(modelLesson, responses);
  assert.ok(grade !== null);
  assert.equal(grade.problems[0].right, true);
  assert.equal(grade.problems[0].points, 0.5);
  assert.equal(grade.problems[1].right, false);
  assert.equal(grade.problems[1].points, 0);
  assert.equal(grade.points, 9.5);
  assert.equal(grade.total, 11);
  assert.equal(grade.score, Math.round((9.5 / 11) * 100));
});

test("gradeLesson drops answers after the first right one and caps tries at 3", () => {
  const problems = gradedProblems(modelLesson);
  const responses = problems.map((p, i) => {
    if (i === 0) return [wrongAnswer(p), rightAnswer(p), wrongAnswer(p)];
    if (i === 1) return [wrongAnswer(p), wrongAnswer(p), wrongAnswer(p), rightAnswer(p)];
    return [rightAnswer(p)];
  });

  const grade = gradeLesson(modelLesson, responses);
  assert.ok(grade !== null);
  assert.deepEqual(grade.problems[0].tried, [wrongAnswer(problems[0]), rightAnswer(problems[0])]);
  assert.equal(grade.problems[0].right, true);
  assert.equal(grade.problems[0].points, 0.5);

  assert.equal(grade.problems[1].tried.length, 3);
  assert.equal(grade.problems[1].right, false);
  assert.equal(grade.problems[1].points, 0);
});

test("gradeLesson truncates response strings longer than 200 characters", () => {
  const problems = gradedProblems(modelLesson);
  const longWrong = "9".repeat(250);
  const responses = problems.map((p, i) => (i === 0 ? [longWrong] : [rightAnswer(p)]));

  const grade = gradeLesson(modelLesson, responses);
  assert.ok(grade !== null);
  assert.equal(grade.problems[0].tried[0].length, 200);
  assert.equal(grade.problems[0].tried[0], "9".repeat(200));
});

test("gradeLesson returns null for invalid responses", () => {
  const problems = gradedProblems(modelLesson);
  const valid = problems.map((p) => [rightAnswer(p)]);

  assert.equal(gradeLesson(modelLesson, null), null);
  assert.equal(gradeLesson(modelLesson, "not-an-array"), null);
  assert.equal(gradeLesson(modelLesson, valid.slice(0, -1)), null);
  assert.equal(gradeLesson(modelLesson, [...valid, [rightAnswer(problems[0])]]), null);

  const badItem: unknown[] = [...valid];
  badItem[0] = rightAnswer(problems[0]);
  assert.equal(gradeLesson(modelLesson, badItem), null);
});
