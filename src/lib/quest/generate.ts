// Server-only: drafts practice questions for a skill with Claude Haiku 5.5, then checks them.
// 1. Draft: structured output, with every wrong choice tagged with the misconception it reveals.
// 2. Verify: a separate call solves each question without seeing the answer; any question whose
//    answer doesn't match is dropped. Survivors are saved as drafts for a teacher to approve.
// 3. Strict (starter bank): a second, independent solve by a stronger model that must agree and
//    judge the question clear with exactly one right answer. These go live without review.

import Anthropic from "@anthropic-ai/sdk";
import { jsonSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/json-schema";
import type { Skill } from "./skills";
import { MISCONCEPTIONS, MISCONCEPTION_IDS } from "./misconceptions";
import { checkAnswer, type QuestChoice } from "./answers";

export const QUEST_MODEL = "claude-haiku-5-5";
export const CHECK_MODEL = "claude-sonnet-5-5";

export interface DraftItem {
  skill_id: string;
  difficulty: number;
  kind: "multiple_choice" | "numeric";
  stem: string;
  choices: QuestChoice[] | null;
  answer: string;
  explanation: string;
}

const draftFormat = jsonSchemaOutputFormat({
  type: "object",
  additionalProperties: false,
  required: ["items"],
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["difficulty", "kind", "stem", "choices", "answer", "explanation"],
        properties: {
          difficulty: { type: "integer", enum: [1, 2, 3] },
          kind: { type: "string", enum: ["multiple_choice", "numeric"] },
          stem: { type: "string" },
          choices: {
            type: "array",
            description: "Exactly 4 for multiple_choice (one correct); empty for numeric",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["text", "correct", "misconception"],
              properties: {
                text: { type: "string" },
                correct: { type: "boolean" },
                misconception: { type: "string", enum: [...MISCONCEPTION_IDS, "none"] },
              },
            },
          },
          answer: { type: "string" },
          explanation: { type: "string" },
        },
      },
    },
  },
});

const verifyFormat = jsonSchemaOutputFormat({
  type: "object",
  additionalProperties: false,
  required: ["answers"],
  properties: {
    answers: { type: "array", items: { type: "string" } },
  },
});

const reviewFormat = jsonSchemaOutputFormat({
  type: "object",
  additionalProperties: false,
  required: ["reviews"],
  properties: {
    reviews: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["answer", "clear"],
        properties: {
          answer: { type: "string" },
          clear: {
            type: "boolean",
            description: "true only if the question is clearly worded, has exactly one correct answer, gives everything needed to solve it, and is right for grades 6–8",
          },
        },
      },
    },
  },
});

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

const tokensOf = (u: Anthropic.Usage) =>
  (u.input_tokens ?? 0) + (u.output_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0);

function structurallyValid(item: DraftItem): boolean {
  if (!item.stem.trim() || !item.answer.trim() || !item.explanation.trim()) return false;
  if (item.kind === "multiple_choice") {
    const choices = item.choices ?? [];
    if (choices.length !== 4 || choices.filter((c) => c.correct).length !== 1) return false;
    if (new Set(choices.map((c) => c.text.trim().toLowerCase())).size !== 4) return false;
    // The answer must be the correct choice
    return checkAnswer(item, choices.find((c) => c.correct)!.text).correct
      && checkAnswer({ kind: "multiple_choice", choices, answer: item.answer }, item.answer).correct;
  }
  return true;
}

const standardsText = (skill: Skill) =>
  [skill.nad && `NAD ${skill.nad}`, skill.standard && `Common Core ${skill.standard}`].filter(Boolean).join(", ");

const questionList = (items: DraftItem[]) => items.map((c, i) =>
  `${i + 1}. ${c.stem}${c.choices ? `\nChoices: ${c.choices.map((ch) => ch.text).join(" | ")}` : ""}`
).join("\n\n");

/** Whether a solver's answer matches the question's intended answer. */
function agrees(c: DraftItem, given: string | undefined): boolean {
  if (given === undefined) return false;
  if (checkAnswer(c, given).correct) return true;
  // Multiple choice: also accept the same value written differently (0.75 vs 3/4)
  const correctText = c.choices?.find((ch) => ch.correct)?.text;
  return !!correctText && checkAnswer({ kind: "numeric", choices: null, answer: correctText }, given).correct;
}

/**
 * Drafts `count` questions for a skill and returns the ones that pass the checks. With `strict`,
 * survivors also need a second independent solve (CHECK_MODEL) that agrees and finds them clear.
 */
/** Lowercased letters and digits only, so the same question worded with different spacing or punctuation matches. */
export const stemKey = (stem: string) => stem.toLowerCase().replace(/[^a-z0-9]+/g, "");

export async function generateItems(
  skill: Skill, count: number, opts: { strict?: boolean; avoid?: string[] } = {},
): Promise<{ items: DraftItem[]; totalTokens: number; dropped: number }> {
  const misconceptionList = MISCONCEPTIONS.map((m) => `- ${m.id}: ${m.name}`).join("\n");
  const gradeText = skill.grade <= 5 ? `grade ${skill.grade} (foundation skill, but written for middle schoolers)` : `grade ${skill.grade}`;

  const draft = await getClient().messages.parse({
    model: QUEST_MODEL,
    max_tokens: 16000,
    output_config: { effort: "medium", format: draftFormat },
    system:
      "You write accurate, clear math practice questions for middle school (grades 6–8) in Christian (Seventh-day Adventist) schools. " +
      "Every question must have exactly one correct answer, and you double-check every computation. Use plain text only (no images, " +
      "no LaTeX); write fractions with a slash like 3/4 and negatives with a minus sign like -5. Keep word problems realistic, short, " +
      "and appropriate for school.",
    messages: [{
      role: "user",
      content:
        `Write ${count} questions for this skill:\n` +
        `Skill: ${skill.name} (${gradeText}, ${standardsText(skill)})\n` +
        `What it covers: ${skill.description}\n\n` +
        `Rules:\n` +
        `- Mix difficulty: about a third each of 1 (straightforward), 2 (typical), 3 (multi-step or word problem).\n` +
        `- About half multiple_choice and half numeric.\n` +
        `- multiple_choice: exactly 4 choices, exactly one with correct=true and misconception "none". Each wrong choice must be ` +
        `the answer a student would get from a specific misconception; tag it with the best-matching id below (use ` +
        `"computation-slip" only for a plain arithmetic mistake). "answer" must equal the correct choice's text.\n` +
        `- numeric: choices must be an empty array. "answer" is just the number: an integer, a decimal, or a simplified fraction ` +
        `like 3/4 or -5/2 (no units, no "x =").\\n` +
        `- If the answer depends on π, rounding, units or time, the stem must say exactly how to answer (for example "Use 3.14 for π ` +
        `and round to the nearest tenth" or "Give your answer in minutes"), so the number alone is unambiguous.\n` +
        `- No pictures: describe any graph, figure, table or data set fully in the text of the stem.\n` +
        `- explanation: 2–3 short sentences showing how to solve it, for the student to read after answering. Keep any rounding ` +
        `in it consistent: don't round a value one way and then round it differently.\n` +
        `- Every question must be different from the others (different numbers and situations)` +
        (opts.avoid?.length ? `, and from these existing questions:\n${opts.avoid.slice(0, 40).map((a) => `  • ${a}`).join("\n")}\n` : ".\n") +
        `\nMisconception ids:\n${misconceptionList}`,
    }],
  });
  let totalTokens = tokensOf(draft.usage);

  const raw = (draft.parsed_output?.items ?? []) as Array<Omit<DraftItem, "skill_id" | "choices"> & { choices: Array<QuestChoice & { misconception: string }> }>;
  const candidates: DraftItem[] = raw
    .map((r) => ({
      skill_id: skill.id,
      difficulty: r.difficulty,
      kind: r.kind,
      stem: r.stem.trim(),
      answer: r.answer.trim(),
      explanation: r.explanation.trim(),
      choices: r.kind === "multiple_choice"
        ? r.choices.map((c) => ({
            text: c.text.trim(),
            ...(c.correct ? { correct: true } : {}),
            ...(!c.correct && c.misconception !== "none" ? { misconception: c.misconception } : {}),
          }))
        : null,
    }))
    .filter(structurallyValid)
    // No repeats of existing questions or of each other
    .filter(((seen) => (c: DraftItem) => {
      const key = stemKey(c.stem);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })(new Set((opts.avoid ?? []).map(stemKey))));

  if (candidates.length === 0) return { items: [], totalTokens, dropped: raw.length };

  // Independent check: solve each question without seeing the intended answer
  const verify = await getClient().messages.parse({
    model: QUEST_MODEL,
    max_tokens: 8000,
    output_config: { effort: "medium", format: verifyFormat },
    system: "You are a careful math checker. Solve each question and give only the final answer, in the same order.",
    messages: [{
      role: "user",
      content:
        "Solve each question. For multiple choice, answer with the exact text of the correct choice. For the others, give just " +
        "the number (integer, decimal, or simplified fraction like 3/4).\n\n" +
        questionList(candidates),
    }],
  });
  totalTokens += tokensOf(verify.usage);

  const solved = (verify.parsed_output?.answers ?? []) as string[];
  let items = candidates.filter((c, i) => agrees(c, solved[i]));

  if (opts.strict && items.length > 0) {
    const review = await getClient().messages.parse({
      model: CHECK_MODEL,
      max_tokens: 8000,
      output_config: { effort: "medium", format: reviewFormat },
      system: "You are a careful middle school math reviewer. Solve each question yourself and judge whether it is fit for students.",
      messages: [{
        role: "user",
        content:
          `These are grade ${skill.grade <= 5 ? "6–8 review" : skill.grade} questions for the skill "${skill.name}". For each, in order: ` +
          "solve it (for multiple choice, give the exact text of the correct choice; otherwise just the number), and say whether " +
          "it is clear, has exactly one correct answer, and gives everything needed to solve it.\n\n" +
          questionList(items),
      }],
    });
    totalTokens += tokensOf(review.usage);
    const reviews = (review.parsed_output?.reviews ?? []) as { answer: string; clear: boolean }[];
    items = items.filter((c, i) => reviews[i]?.clear === true && agrees(c, reviews[i]?.answer));
  }

  return { items, totalTokens, dropped: raw.length - items.length };
}
