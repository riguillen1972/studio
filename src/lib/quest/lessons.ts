// Server-only: writes a short lesson for a skill with Claude Haiku 5.5, then checks it.
// 1. Draft: structured output (explanation, two worked examples, a common mistake, a quick check).
// 2. Check, with CHECK_MODEL: one call solves the examples and the quick check without seeing the
//    answers, another reviews the whole lesson for accuracy and clarity. A lesson is kept only if
//    the solved answers match and the review passes; otherwise it is redrafted once with the
//    reviewer's notes.

import Anthropic from "@anthropic-ai/sdk";
import { jsonSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/json-schema";
import { SKILLS_BY_ID, type Skill } from "./skills";
import { MISCONCEPTIONS } from "./misconceptions";
import { checkAnswer } from "./answers";
import { CHECK_MODEL, QUEST_MODEL } from "./generate";
import type { LessonContent } from "./lesson-types";

const lessonFormat = jsonSchemaOutputFormat({
  type: "object",
  additionalProperties: false,
  required: ["title", "why", "vocabulary", "explain", "examples", "watch_out", "faith", "check"],
  properties: {
    title: { type: "string" },
    why: { type: "string" },
    vocabulary: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["term", "meaning"], properties: { term: { type: "string" }, meaning: { type: "string" } } },
    },
    explain: { type: "array", items: { type: "string" } },
    examples: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["problem", "steps", "answer", "answer_number"],
        properties: {
          problem: { type: "string" },
          steps: { type: "array", items: { type: "string" } },
          answer: { type: "string" },
          answer_number: { type: "string", description: "The final answer as just a number (integer, decimal or simplified fraction), or empty if the answer isn't a number" },
        },
      },
    },
    watch_out: { type: "string" },
    faith: { type: "string", description: "One or two sentences, or an empty string when no connection fits naturally" },
    check: {
      type: "object",
      additionalProperties: false,
      required: ["question", "answer", "hint"],
      properties: { question: { type: "string" }, answer: { type: "string" }, hint: { type: "string" } },
    },
  },
});

const solveFormat = jsonSchemaOutputFormat({
  type: "object",
  additionalProperties: false,
  required: ["answers"],
  properties: { answers: { type: "array", items: { type: "string" } } },
});

const reviewFormat = jsonSchemaOutputFormat({
  type: "object",
  additionalProperties: false,
  required: ["accurate", "clear", "issues"],
  properties: {
    accurate: { type: "boolean", description: "true only if every statement, step and answer in the lesson is mathematically correct" },
    clear: { type: "boolean", description: "true only if a typical student in this grade could follow it, it teaches this skill, and any faith connection is brief, respectful and accurate" },
    issues: { type: "string", description: "What must be fixed, or an empty string" },
  },
});

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

const tokensOf = (u: Anthropic.Usage) =>
  (u.input_tokens ?? 0) + (u.output_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0);

type Draft = Omit<LessonContent, "examples" | "faith"> & { faith: string; examples: (LessonContent["examples"][number] & { answer_number: string })[] };

const SYSTEM =
  "You write short, warm, accurate math lessons for middle school students (grades 6–8) in Christian (Seventh-day Adventist) " +
  "schools. Students may read them on their own or listen to them read aloud, so write in plain, friendly sentences a 12-year-old " +
  "understands, and double-check every computation. Use plain text only (no images, no LaTeX, no tables); write fractions with a " +
  "slash like 3/4, powers with ^ like 5^2, and negatives with a minus sign like -5. You may use **bold** for key words.";

function draftPrompt(skill: Skill, feedback?: string) {
  const builds = skill.prereqs.map((p) => SKILLS_BY_ID[p]?.name).filter(Boolean).join(", ");
  const level = skill.grade <= 5 ? `a grade ${skill.grade} skill reviewed by middle schoolers` : `grade ${skill.grade}`;
  return (
    `Write a lesson for this skill:\n` +
    `Skill: ${skill.name} (${level}${skill.advanced ? ", challenge skill" : ""})\n` +
    `What it covers: ${skill.description}\n` +
    (builds ? `It builds on: ${builds}\n` : "") +
    `\nParts:\n` +
    `- title: the skill in a few words.\n` +
    `- why: one or two sentences on where this shows up in real life.\n` +
    `- vocabulary: 0 to 4 key terms with a short, kid-friendly meaning (only terms the lesson uses).\n` +
    `- explain: 2 to 4 short paragraphs (2–3 sentences each) teaching the key idea and the method step by step.\n` +
    `- examples: exactly 2 worked examples, the second a little harder (a word problem if it fits). Each has the problem, 2 to 5 ` +
    `short steps, the final answer as a sentence or value, and answer_number (just the number, or empty if not numeric). If the ` +
    `answer depends on π or rounding, the problem must say how (for example "use 3.14 for π, round to the nearest tenth").\n` +
    `- watch_out: the most common mistake with this skill and how to avoid it, in 1–2 sentences. Common mistakes include: ` +
    `${MISCONCEPTIONS.slice(0, 40).map((m) => m.name.toLowerCase()).join("; ")}.\n` +
    `- faith: only if it fits naturally, one or two sentences connecting the math to faith or character (for example stewardship ` +
    `with money and percents, order and design in creation with patterns and geometry, honesty with data). Don't preach and don't ` +
    `force it; most skills should get an empty string. If you mention Scripture, give the reference rather than quoting at length.\n` +
    `- check: one quick question like the examples, whose answer is just a number, with a one-sentence hint.\n` +
    (feedback ? `\nA reviewer found problems in the last draft. Fix them:\n${feedback}\n` : "")
  );
}

const numericMatch = (expected: string, given: string | undefined) => {
  if (given === undefined) return false;
  const matches = (g: string) => checkAnswer({ kind: "numeric", choices: null, answer: expected }, g).correct;
  if (matches(given)) return true;
  // A checker may add units or words ("17 students", "12 cm"): compare the number they start with
  const leading = given.replace(/^[a-z]\s*=\s*/i, "").match(/^\s*-?\$?\d[\d,]*(?:\.\d+)?(?:\s+\d+\/\d+|\/\d+)?/);
  return !!leading && matches(leading[0]);
};

/** Problems for the blind solve: the two examples, then the quick check. */
const problemList = (d: Draft) =>
  [...d.examples.map((e) => e.problem), d.check.question].map((p, i) => `${i + 1}. ${p}`).join("\n\n");

function lessonText(d: Draft) {
  return [
    `Title: ${d.title}`, `Why: ${d.why}`,
    `Vocabulary: ${d.vocabulary.map((v) => `${v.term}: ${v.meaning}`).join("; ") || "(none)"}`,
    `Explanation:\n${d.explain.join("\n")}`,
    ...d.examples.map((e, i) => `Example ${i + 1}: ${e.problem}\nSteps:\n${e.steps.map((s, j) => `${j + 1}) ${s}`).join("\n")}\nAnswer: ${e.answer}`),
    `Watch out: ${d.watch_out}`, `Faith connection: ${d.faith || "(none)"}`,
    `Quick check: ${d.check.question} (answer ${d.check.answer}; hint: ${d.check.hint})`,
  ].join("\n\n");
}

function structurallyValid(d: Draft | null): d is Draft {
  return !!d && !!d.title.trim() && !!d.why.trim() && d.explain.length >= 1 && d.explain.length <= 5
    && d.examples.length === 2 && d.examples.every((e) => e.problem.trim() && e.steps.length >= 1 && e.answer.trim())
    && !!d.watch_out.trim() && !!d.check.question.trim() && numericMatch(d.check.answer, d.check.answer);
}

async function checkDraft(skill: Skill, d: Draft): Promise<{ ok: boolean; issues: string; tokens: number }> {
  const [solve, review] = await Promise.all([
    getClient().messages.parse({
      model: CHECK_MODEL,
      max_tokens: 4000,
      output_config: { effort: "medium", format: solveFormat },
      system: "You are a careful math checker. Solve each problem and give only the final answer, in the same order.",
      messages: [{ role: "user", content: `Solve each problem. Give just the final answer for each: when it's numeric, only the number (no units, words or "x =").\n\n${problemList(d)}` }],
    }),
    getClient().messages.parse({
      model: CHECK_MODEL,
      max_tokens: 4000,
      output_config: { effort: "medium", format: reviewFormat },
      system: "You are a careful middle school math teacher reviewing a lesson before students see it.",
      messages: [{
        role: "user",
        content: `Review this lesson for the grade ${skill.grade <= 5 ? "6–8 review" : skill.grade} skill "${skill.name}" (${skill.description}). ` +
          `Check every statement, step and answer, and whether students can follow it.\n\n${lessonText(d)}`,
      }],
    }),
  ]);
  const tokens = tokensOf(solve.usage) + tokensOf(review.usage);
  const answers = (solve.parsed_output?.answers ?? []) as string[];
  const mismatches: string[] = [];
  d.examples.forEach((e, i) => {
    if (e.answer_number.trim() && !numericMatch(e.answer_number, answers[i])) mismatches.push(`Example ${i + 1}: a checker got ${answers[i] ?? "no answer"}, not ${e.answer_number}.`);
  });
  if (!numericMatch(d.check.answer, answers[2])) mismatches.push(`Quick check: a checker got ${answers[2] ?? "no answer"}, not ${d.check.answer}.`);
  const r = review.parsed_output as { accurate: boolean; clear: boolean; issues: string } | null;
  const ok = mismatches.length === 0 && !!r?.accurate && !!r?.clear;
  return { ok, issues: [...mismatches, r?.issues ?? ""].filter(Boolean).join("\n"), tokens };
}

/** Writes and checks a lesson for a skill. Returns null if no draft passes the checks in two tries. */
export async function generateLesson(skill: Skill): Promise<{ lesson: LessonContent | null; totalTokens: number; issues: string }> {
  let totalTokens = 0;
  let feedback: string | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    const draft = await getClient().messages.parse({
      model: QUEST_MODEL,
      max_tokens: 6000,
      output_config: { effort: "medium", format: lessonFormat },
      system: SYSTEM,
      messages: [{ role: "user", content: draftPrompt(skill, feedback) }],
    });
    totalTokens += tokensOf(draft.usage);
    const d = draft.parsed_output as Draft | null;
    if (!structurallyValid(d)) {
      feedback = "The lesson was missing parts: it needs exactly 2 examples with steps, and a quick check whose answer is a number.";
      continue;
    }
    const check = await checkDraft(skill, d);
    totalTokens += check.tokens;
    if (check.ok) {
      const clean = (s: string) => s.trim();
      return {
        totalTokens, issues: "",
        lesson: {
          title: clean(d.title), why: clean(d.why),
          vocabulary: d.vocabulary.filter((v) => v.term.trim() && v.meaning.trim()).slice(0, 4),
          explain: d.explain.map(clean).filter(Boolean),
          examples: d.examples.map((e) => ({ problem: clean(e.problem), steps: e.steps.map(clean).filter(Boolean), answer: clean(e.answer) })),
          watch_out: clean(d.watch_out),
          faith: d.faith.trim() || null,
          check: { question: clean(d.check.question), answer: clean(d.check.answer), hint: clean(d.check.hint) },
        },
      };
    }
    feedback = check.issues || "The checker didn't agree with the answers. Recheck every computation.";
  }
  return { lesson: null, totalTokens, issues: feedback ?? "" };
}
