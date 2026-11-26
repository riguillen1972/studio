import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  allProblems,
  bookAsText,
  feedbackFor,
  fromShortLesson,
  isRight,
  lessonProblems,
  type BookProblem,
  type TextbookLesson,
} from "../src/lib/textbook-lesson";
import type { LessonContent } from "../src/lib/quest/lesson-types";

const modelLesson = JSON.parse(
  readFileSync(path.join(process.cwd(), "content/textbook/6.long-division.json"), "utf8"),
) as TextbookLesson;

test("isRight accepts equivalent numeric responses and rejects wrong or empty ones", () => {
  const whole: Pick<BookProblem, "kind" | "choices" | "answer"> = {
    kind: "numeric",
    answer: "342",
  };
  assert.equal(isRight(whole, "342"), true);
  assert.equal(isRight(whole, " 342 "), true);
  assert.equal(isRight(whole, "342.0"), true);
  assert.equal(isRight(whole, "34"), false);
  assert.equal(isRight(whole, ""), false);

  const fraction: Pick<BookProblem, "kind" | "choices" | "answer"> = {
    kind: "numeric",
    answer: "3/4",
  };
  assert.equal(isRight(fraction, "0.75"), true);
  assert.equal(isRight(fraction, "6/8"), true);
});

test("isRight matches multiple choice by exact trimmed choice text", () => {
  const mc: Pick<BookProblem, "kind" | "choices" | "answer"> = {
    kind: "multiple_choice",
    choices: ["About 5", "About 50", "About 500"],
    answer: "About 50",
  };

  assert.equal(isRight(mc, "About 50"), true);
  assert.equal(isRight(mc, "  About 50  "), true);
  assert.equal(isRight(mc, "About 500"), false);
  assert.equal(isRight(mc, "about 50"), false);
});

test("feedbackFor matches listed wrong numeric answers in equivalent forms and returns null otherwise", () => {
  const problem: BookProblem = {
    question: "Find 2,736 ÷ 8.",
    kind: "numeric",
    answer: "342",
    hints: ["Start with 27 ÷ 8."],
    solution: ["2,736 ÷ 8 = 342."],
    wrong: [{ answer: "34", feedback: "You stopped one step early." }],
  };

  assert.equal(feedbackFor(problem, "34"), "You stopped one step early.");
  assert.equal(feedbackFor(problem, "34.0"), "You stopped one step early.");
  assert.equal(feedbackFor(problem, "999"), null);
});

test("lessonProblems reports no issues for the model 6.long-division lesson", () => {
  assert.deepEqual(lessonProblems(modelLesson), []);
});

test("lessonProblems flags a numeric answer that is not a number", () => {
  const copy = structuredClone(modelLesson);
  copy.warm_up[0].answer = "abc";
  assert.ok(lessonProblems(copy).length > 0);
});

test("lessonProblems flags a multiple-choice answer that is not among its choices", () => {
  const copy = structuredClone(modelLesson);
  const mc = copy.worksheet.find((p) => p.kind === "multiple_choice");
  assert.ok(mc);
  mc.answer = "Not one of the choices";
  assert.ok(lessonProblems(copy).length > 0);
});

test("lessonProblems flags a multiple-choice problem with only 2 choices", () => {
  const copy = structuredClone(modelLesson);
  const mc = copy.worksheet.find((p) => p.kind === "multiple_choice");
  assert.ok(mc && mc.choices);
  mc.choices = [mc.answer, mc.choices.find((c) => c !== mc.answer)!];
  assert.ok(lessonProblems(copy).length > 0);
});

test("lessonProblems flags a wrong answer that equals the right answer", () => {
  const copy = structuredClone(modelLesson);
  copy.warm_up[0].wrong.push({
    answer: copy.warm_up[0].answer,
    feedback: "Should not be flagged as wrong.",
  });
  assert.ok(lessonProblems(copy).length > 0);
});

test("lessonProblems flags a lesson with only 1 part", () => {
  const copy = structuredClone(modelLesson);
  copy.parts = copy.parts.slice(0, 1);
  assert.ok(lessonProblems(copy).length > 0);
});

test("lessonProblems flags a worksheet with only 5 problems", () => {
  const copy = structuredClone(modelLesson);
  copy.worksheet = copy.worksheet.slice(0, 5);
  assert.ok(lessonProblems(copy).length > 0);
});

test("allProblems returns warm-up, try_it, and worksheet problems in order with expected labels", () => {
  const items = allProblems(modelLesson);
  const expectedCount =
    modelLesson.warm_up.length +
    modelLesson.parts.reduce((sum, part) => sum + part.try_it.length, 0) +
    modelLesson.worksheet.length;

  assert.equal(items.length, expectedCount);
  assert.equal(items[0].label, "Warm-up 1");
  assert.equal(items[modelLesson.warm_up.length].label, "Part 1 Try It 1");
  assert.equal(items[items.length - modelLesson.worksheet.length].label, "Worksheet 1");
});

test("bookAsText includes title and worksheet questions without leaking Try It or worksheet answers", () => {
  const text = bookAsText(modelLesson);

  assert.ok(text.includes(modelLesson.title));
  for (const w of modelLesson.worksheet) {
    assert.ok(text.includes(w.question), `Expected bookAsText to include worksheet question: ${w.question}`);
  }
  assert.equal(text.includes("Answer: 342"), false);
  assert.equal(text.includes('"answer"'), false);
});

test("fromShortLesson converts a short LessonContent into a version-2 TextbookLesson", () => {
  const short: LessonContent = {
    title: "Dividing Decimals",
    why: "Prices at the store often use decimals.",
    vocabulary: [{ term: "divisor", meaning: "the number you divide by" }],
    explain: ["Move the decimal point in the divisor to make it a whole number."],
    examples: [
      { problem: "1.2 ÷ 0.4", steps: ["Multiply both by 10", "12 ÷ 4 = 3"], answer: "3" },
      { problem: "2.25 ÷ 0.5", steps: ["Multiply both by 10", "22.5 ÷ 5 = 4.5"], answer: "4.5" },
    ],
    watch_out: "Remember to move the decimal point in the dividend the same number of places.",
    faith: null,
    check: { question: "What is 1.5 ÷ 0.3?", answer: "5", hint: "Think 15 ÷ 3." },
  };

  const book = fromShortLesson("6.decimal-division", short);

  assert.equal(book.version, 2);
  assert.equal(book.parts.length, short.examples.length);
  assert.deepEqual(book.parts[0].try_it, []);
  assert.equal(book.parts[book.parts.length - 1].try_it.length, 1);
  assert.equal(book.parts[book.parts.length - 1].try_it[0].kind, "numeric");
  assert.equal(book.parts[book.parts.length - 1].try_it[0].question, short.check.question);
  assert.deepEqual(book.worksheet, []);
  assert.equal(book.mistake.what_went_wrong, short.watch_out);
});
