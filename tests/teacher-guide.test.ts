import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { buildTeacherGuide, guideAsText } from "../src/lib/teacher-guide";
import { allProblems, fromShortLesson, type TextbookLesson } from "../src/lib/textbook-lesson";
import type { LessonContent } from "../src/lib/quest/lesson-types";

const textbookDir = path.join(process.cwd(), "content/textbook");
const lessonFiles = readdirSync(textbookDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
  .map((entry) => entry.name)
  .sort();

assert.ok(lessonFiles.includes("6.long-division.json"), "Expected 6.long-division.json in content/textbook");

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value && typeof value === "object") return Object.values(value).flatMap(collectStrings);
  return [];
}

for (const file of lessonFiles) {
  test(`buildTeacherGuide produces a valid guide for ${file}`, () => {
    const lesson = JSON.parse(readFileSync(path.join(textbookDir, file), "utf8")) as TextbookLesson;
    const guide = buildTeacherGuide(lesson);

    const planMinutes = guide.plan.reduce((sum, section) => sum + section.minutes, 0);
    assert.equal(guide.totalMinutes, planMinutes);
    for (const section of guide.plan) {
      assert.ok(section.minutes > 0, `${file} section "${section.title}" should have minutes > 0`);
      assert.ok(section.steps.length > 0, `${file} section "${section.title}" should have at least one step`);
    }

    if (lesson.warm_up.length > 0) {
      assert.equal(guide.plan[0]?.title, "Warm-up");
    }
    assert.equal(guide.plan[guide.plan.length - 1]?.title, "Wrap-up and exit ticket");

    const partSections = guide.plan.filter((s) => /^Part \d+:/.test(s.title));
    assert.equal(partSections.length, lesson.parts.length);
    partSections.forEach((section, index) => {
      assert.ok(section.title.startsWith(`Part ${index + 1}:`), `Expected Part ${index + 1}: in order, got ${section.title}`);
    });

    const problems = allProblems(lesson);
    assert.equal(guide.answerKey.length, problems.length);
    for (const item of guide.answerKey) {
      assert.ok(item.answer.trim().length > 0, `${file} answerKey item "${item.label}" has empty answer`);
    }

    assert.ok(guide.exitTicket.length >= 1 && guide.exitTicket.length <= 3, `${file} exitTicket count: ${guide.exitTicket.length}`);
    for (const ticketItem of guide.exitTicket) {
      const match = guide.answerKey.find(
        (keyItem) =>
          keyItem.question === ticketItem.question &&
          keyItem.answer === ticketItem.answer &&
          keyItem.label === ticketItem.label,
      );
      assert.ok(match, `${file} exitTicket item "${ticketItem.label}" should match an answerKey item`);
    }

    assert.ok(guide.misconceptions.length <= 8);

    const text = guideAsText(guide);
    assert.ok(text.lesson.includes(guide.title));
    for (const section of guide.plan) {
      assert.ok(text.lesson.includes(section.title), `${file} guideAsText.lesson missing "${section.title}"`);
    }
    for (const item of guide.answerKey) {
      assert.ok(text.answerKey.includes(item.answer), `${file} guideAsText.answerKey missing "${item.answer}"`);
    }

    for (const str of collectStrings(guide)) {
      assert.equal(str.includes("**"), false, `${file} guide contains markdown bold "**" in: ${str}`);
    }
  });
}

test("buildTeacherGuide handles a short lesson converted via fromShortLesson", () => {
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
  const guide = buildTeacherGuide(book);

  assert.equal(guide.title, short.title);
  assert.equal(guide.plan.some((s) => s.title === "Spot the mistake"), false);
  assert.equal(guide.plan.some((s) => s.title === "Worksheet"), false);
  assert.equal(guide.totalMinutes, guide.plan.reduce((sum, s) => sum + s.minutes, 0));
});
