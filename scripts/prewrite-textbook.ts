/**
 * Pre-writes the Math Textbook: one full lesson per skill, following the research-based blueprint
 * in docs/textbook-research.md and the hand-written model lesson in content/textbook/.
 *
 * For each lesson:
 *   1. Claude Opus 5.5 writes it (structured JSON, the blueprint and model lesson in a cached prompt).
 *   2. The format is checked in code (answers the app can check, wrong answers really wrong…).
 *   3. Claude Sonnet 5.5 solves every problem blind, without seeing the answers. The answers must match.
 *   4. A reviewer lists real math errors (quoting the false words), off-grade-level content and
 *      feedback that gives the answer away.
 *   5. Any problem goes back to the writer for a revision (up to 2). A lesson that passes is saved to
 *      content/textbook/<skill>.json; one that doesn't goes to content/textbook/_needs-review/.
 *
 * Usage (the API key comes from .env.local; nothing is written for lessons that already exist):
 *   npx tsx --env-file=.env.local scripts/prewrite-textbook.ts --grade 6 [--limit 5] [--concurrency 3]
 *   npx tsx --env-file=.env.local scripts/prewrite-textbook.ts --skills 6.ratios,7.proportional
 *   npx tsx scripts/prewrite-textbook.ts --grade 6 --dry-run      (lists what would be written)
 *   add --force to rewrite lessons that already exist
 */

import Anthropic from "@anthropic-ai/sdk";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { SKILLS_BY_ID, type Skill } from "../src/lib/quest/skills";
import { MISCONCEPTIONS } from "../src/lib/quest/misconceptions";
import { textbookUnits } from "../src/lib/textbook";
import { allProblems, isRight, lessonProblems, type TextbookLesson } from "../src/lib/textbook-lesson";

const WRITER_MODEL = "claude-opus-5-5";
const CHECK_MODEL = "claude-sonnet-5-5";
const PRICES: Record<string, { in: number; out: number; cacheRead: number; cacheWrite: number }> = {
  [WRITER_MODEL]: { in: 4, out: 20, cacheRead: 0.2, cacheWrite: 5 },
  [CHECK_MODEL]: { in: 2, out: 10, cacheRead: 0.1, cacheWrite: 2.5 },
};
const MAX_REVISIONS = 2;
const ROOT = process.cwd();
const OUT = path.join(ROOT, "content/textbook");
const REVIEW = path.join(OUT, "_needs-review");
const MODEL_LESSONS = ["6.long-division"];

// ---------- arguments ----------
const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const option = (name: string) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
const grades = option("grade") ? [Number(option("grade"))] : flag("all") ? [6, 7, 8] : [];
const onlySkills = option("skills")?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
const limit = Number(option("limit") ?? Infinity);
const concurrency = Math.max(1, Number(option("concurrency") ?? 3));
const force = flag("force");
const dryRun = flag("dry-run");

if (!grades.length && !onlySkills.length) {
  console.log("Choose lessons with --grade 6|7|8, --all, or --skills id1,id2. Add --dry-run to just list them.");
  process.exit(1);
}

// ---------- the lesson schema the writer fills in ----------
const str = { type: "string" };
const strings = { type: "array", items: str };
const problemProps = {
  question: str,
  kind: { type: "string", enum: ["numeric", "multiple_choice"] },
  choices: { ...strings, description: "3–4 choices for multiple choice (one equals the answer); empty for numeric" },
  answer: { type: "string", description: "Numeric: one number only (like 342, 3/4, -2.5, no units or commas). Multiple choice: the exact text of the correct choice" },
  hints: { ...strings, description: "Two hints: a gentle nudge, then a more specific one. Neither gives the final answer" },
  solution: { ...strings, description: "The worked solution, step by step" },
  wrong: {
    type: "array",
    description: "1–3 likely wrong answers, each with feedback that names the mistake behind it WITHOUT stating the correct final answer",
    items: { type: "object", additionalProperties: false, required: ["answer", "feedback"], properties: { answer: str, feedback: str } },
  },
};
const problemRequired = ["question", "kind", "choices", "answer", "hints", "solution", "wrong"];
const problem = { type: "object", additionalProperties: false, required: problemRequired, properties: problemProps };
const worksheetProblem = {
  type: "object", additionalProperties: false, required: ["level", ...problemRequired],
  properties: { level: { type: "string", enum: ["practice", "apply", "think", "review", "challenge"] }, ...problemProps },
};
const lessonSchema: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["title", "hook", "goal", "vocabulary", "warm_up", "parts", "mistake", "summary", "faith", "worksheet"],
  properties: {
    title: str,
    hook: str,
    goal: { type: "string", description: "Starts with \"I can\"" },
    vocabulary: { type: "array", items: { type: "object", additionalProperties: false, required: ["term", "meaning", "example"], properties: { term: str, meaning: str, example: str } } },
    warm_up: { type: "array", description: "Exactly 2 problems from earlier skills", items: problem },
    parts: {
      type: "array", description: "2–4 parts, each one step of the skill",
      items: {
        type: "object", additionalProperties: false, required: ["heading", "read", "model", "example", "try_it", "mentor"],
        properties: {
          heading: str,
          read: strings,
          model: {
            anyOf: [
              { type: "object", additionalProperties: false, required: ["caption", "rows"], properties: { caption: str, rows: { type: "array", items: strings, description: "First row is the header" } } },
              { type: "null" },
            ],
          },
          example: {
            type: "object", additionalProperties: false, required: ["problem", "steps", "answer"],
            properties: {
              problem: str,
              steps: { type: "array", items: { type: "object", additionalProperties: false, required: ["say", "why"], properties: { say: str, why: str } } },
              answer: str,
            },
          },
          try_it: { type: "array", description: "1–2 problems, the first close to the example", items: problem },
          mentor: str,
        },
      },
    },
    mistake: { type: "object", additionalProperties: false, required: ["problem", "work", "what_went_wrong", "fix"], properties: { problem: str, work: strings, what_went_wrong: str, fix: str } },
    summary: strings,
    faith: { type: "string", description: "Empty string unless a connection fits naturally" },
    worksheet: { type: "array", description: "10–12 problems in the blueprint's order", items: worksheetProblem },
  },
};

const solveSchema = { type: "object", additionalProperties: false, required: ["answers"], properties: { answers: strings } };
const reviewSchema = {
  type: "object", additionalProperties: false, required: ["math_errors", "grade_level", "other_problems"],
  properties: {
    math_errors: {
      type: "array",
      description: "Only real errors: a wrong number, wrong step or false math statement. Not wording or style. Empty if none.",
      items: { type: "object", additionalProperties: false, required: ["quote", "why_wrong", "correct"], properties: { quote: str, why_wrong: str, correct: str } },
    },
    grade_level: { type: "string", description: "\"ok\", or what is below or above the grade's standard" },
    other_problems: {
      ...strings,
      description: "Serious problems only: feedback or a hint that states the final answer, a question that is ambiguous or has two right answers, a part that doesn't teach this skill, unkind or preachy wording. Empty if none.",
    },
  },
};

// ---------- prompts ----------
const research = readFileSync(path.join(ROOT, "docs/textbook-research.md"), "utf8");
const blueprint = research.slice(research.indexOf("## The lesson blueprint"), research.indexOf("## Sources")).trim();
const modelLessons = MODEL_LESSONS
  .filter((id) => existsSync(path.join(OUT, `${id}.json`)))
  .map((id) => readFileSync(path.join(OUT, `${id}.json`), "utf8"));

const SYSTEM = `You write lessons for the Study Buddy Math Textbook, an online textbook for grades 6–8 in Seventh-day Adventist (NAD) schools. Each lesson teaches one skill at full grade level, so it meets the NAD standard, but presents it so it doesn't feel hard: small steps, worked examples, friendly language, and a mentor who catches mistakes kindly.

A student reads each part with their mentor, does the Try Its (the app checks the answer, and a wrong answer shows the feedback you write for it), then does the worksheet. Wrong answers you list must be ones real students give, and each feedback must name the mistake and point to the fix without stating the final answer.

${blueprint}

Here is a model lesson that follows the blueprint well. Match its depth, tone and quality, but write fresh content for each skill (different situations and numbers):

${modelLessons.join("\n\n")}`;

function skillBrief(skill: Skill): string {
  const name = (id: string) => SKILLS_BY_ID[id] ? `${SKILLS_BY_ID[id].name} (${SKILLS_BY_ID[id].description})` : id;
  const prereqs = skill.prereqs.map(name);
  return [
    `Write the lesson for this skill:`,
    `Skill: ${skill.name}`,
    `Grade: ${skill.grade}${skill.advanced ? " (challenge lesson: goes beyond the core standard)" : ""}`,
    `NAD standard: ${skill.nad || "foundation skill"}${skill.standard ? `; matching Common Core: ${skill.standard}` : ""}`,
    `What it covers: ${skill.description}`,
    prereqs.length ? `It builds on (use these for the warm-up and the review problems): ${prereqs.join("; ")}` : `It has no earlier skill; base the warm-up and review on basic grade ${skill.grade - 1} arithmetic.`,
    `Common mistakes to consider for "Spot the mistake" and the wrong answers: ${MISCONCEPTIONS.map((m) => m.name.toLowerCase()).join("; ")}.`,
  ].join("\n");
}

// ---------- API calls ----------
const client = new Anthropic();
let spent = 0;
function cost(model: string, u: Anthropic.Beta.BetaUsage) {
  const p = PRICES[model];
  const dollars = ((u.input_tokens ?? 0) * p.in + (u.output_tokens ?? 0) * p.out
    + (u.cache_read_input_tokens ?? 0) * p.cacheRead + (u.cache_creation_input_tokens ?? 0) * p.cacheWrite) / 1e6;
  spent += dollars;
  return dollars;
}

/** One structured-output call, streamed (lessons are long). Returns the parsed JSON. */
async function ask<T>(model: string, system: string | Anthropic.Beta.BetaTextBlockParam[], content: string, schema: Record<string, unknown>, effort: "medium" | "high", maxTokens: number): Promise<T> {
  // Refusal fallbacks are on (a declined request is retried on a fallback model); math lessons rarely need it
  const stream = client.beta.messages.stream({
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    model,
    max_tokens: maxTokens,
    system,
    output_config: { effort, format: { type: "json_schema", schema } },
    messages: [{ role: "user", content }],
  });
  const message = await stream.finalMessage();
  cost(model, message.usage);
  if (message.stop_reason === "refusal") throw new Error("The model declined this request.");
  if (message.stop_reason === "max_tokens") throw new Error("The response was cut off (max_tokens).");
  const text = message.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  return JSON.parse(text) as T;
}

const writerSystem: Anthropic.Beta.BetaTextBlockParam[] = [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral", ttl: "1h" } }];

type Draft = Omit<TextbookLesson, "version" | "skill_id" | "faith"> & { faith: string };

function toLesson(skillId: string, d: Draft): TextbookLesson {
  const fix = <P extends { kind: string; choices?: string[] }>(p: P): P => (p.kind === "numeric" ? { ...p, choices: undefined } : p);
  return {
    version: 2, skill_id: skillId, ...d,
    faith: d.faith.trim() || null,
    warm_up: d.warm_up.map(fix),
    parts: d.parts.map((part) => ({ ...part, try_it: part.try_it.map(fix) })),
    worksheet: d.worksheet.map(fix),
  };
}

async function check(skill: Skill, lesson: TextbookLesson): Promise<string[]> {
  const issues = lessonProblems(lesson);
  if (lesson.warm_up.length !== 2) issues.push("needs exactly 2 warm-up problems");
  if (lesson.worksheet.length > 12) issues.push("the worksheet should have 10–12 problems");
  if (issues.length) return issues;

  const problems = allProblems(lesson);
  const list = problems.map(({ label, problem: p }, i) =>
    `${i + 1}. [${label}] ${p.question}${p.choices ? `\nChoices: ${p.choices.map((c) => `"${c}"`).join(", ")}` : ""}`).join("\n\n");
  const lessonJson = JSON.stringify({ ...lesson, worksheet: lesson.worksheet }, null, 1);

  const [solved, review] = await Promise.all([
    ask<{ answers: string[] }>(CHECK_MODEL, "You are a careful math checker. Solve each problem yourself.",
      `Solve each problem. For each, give only the final answer, in order: a single number for numeric problems (no units or words; fractions like 3/4 are fine), or the exact text of the correct choice for multiple choice.\n\n${list}`,
      solveSchema, "high", 16000),
    ask<{ math_errors: { quote: string; why_wrong: string; correct: string }[]; grade_level: string; other_problems: string[] }>(CHECK_MODEL,
      "You are an experienced middle school math teacher reviewing a textbook lesson before students see it. A math error is only something false. Before listing one, recompute it yourself; if the statement is actually true, it is not an error.",
      `Review this grade ${skill.grade} lesson for "${skill.name}" (NAD ${skill.nad || "foundation"}${skill.standard ? `, ${skill.standard}` : ""}: ${skill.description}).\n\n${lessonJson}`,
      reviewSchema, "high", 16000),
  ]);

  problems.forEach(({ label, problem: p }, i) => {
    const got = solved.answers[i];
    if (got === undefined || !isRight(p, got)) issues.push(`${label}: an independent solver got "${got ?? "no answer"}", but the lesson says "${p.answer}". Recheck the question and the answer, and make the question unambiguous.`);
  });
  for (const e of review.math_errors) if (e.quote.trim()) issues.push(`Math error: "${e.quote}". ${e.why_wrong} Correct: ${e.correct}`);
  if (review.grade_level.trim().toLowerCase() !== "ok") issues.push(`Grade level: ${review.grade_level}`);
  issues.push(...review.other_problems.filter((s) => s.trim()));
  return issues;
}

async function writeLesson(skill: Skill): Promise<{ ok: boolean; issues: string[] }> {
  const brief = skillBrief(skill);
  let draft = await ask<Draft>(WRITER_MODEL, writerSystem, brief, lessonSchema, "high", 64000);
  let issues: string[] = [];
  for (let round = 0; ; round++) {
    const lesson = toLesson(skill.id, draft);
    issues = await check(skill, lesson);
    if (!issues.length) {
      writeFileSync(path.join(OUT, `${skill.id}.json`), JSON.stringify(lesson, null, 2) + "\n");
      return { ok: true, issues: [] };
    }
    if (round >= MAX_REVISIONS) {
      mkdirSync(REVIEW, { recursive: true });
      writeFileSync(path.join(REVIEW, `${skill.id}.json`), JSON.stringify({ issues, lesson }, null, 2) + "\n");
      return { ok: false, issues };
    }
    draft = await ask<Draft>(WRITER_MODEL, writerSystem,
      `${brief}\n\nHere is your draft:\n${JSON.stringify(draft)}\n\nA review found these problems. Fix every one (rewrite a problem entirely if that's simpler), keep everything else, and return the whole corrected lesson:\n- ${issues.join("\n- ")}`,
      lessonSchema, "high", 64000);
  }
}

// ---------- run ----------
async function main() {
  const ids = onlySkills.length ? onlySkills : grades.flatMap((g) => textbookUnits(g).flatMap((u) => u.chapters.flatMap((c) => c.skillIds)));
  const unknown = ids.filter((id) => !SKILLS_BY_ID[id]);
  if (unknown.length) { console.log(`Unknown skills: ${unknown.join(", ")}`); process.exit(1); }
  const todo = ids.filter((id) => force || !existsSync(path.join(OUT, `${id}.json`))).slice(0, limit);
  console.log(`${todo.length} lesson(s) to write (${ids.length - todo.length} already written or skipped by --limit).`);
  if (dryRun) { console.log(todo.join("\n")); return; }
  if (!process.env.ANTHROPIC_API_KEY) { console.log("ANTHROPIC_API_KEY isn't set. Run with: npx tsx --env-file=.env.local scripts/prewrite-textbook.ts …"); process.exit(1); }

  mkdirSync(OUT, { recursive: true });
  let next = 0, passed = 0;
  const failed: string[] = [];
  const worker = async () => {
    while (next < todo.length) {
      const id = todo[next++];
      const started = Date.now();
      try {
        const r = await writeLesson(SKILLS_BY_ID[id]);
        if (r.ok) passed++; else failed.push(id);
        console.log(`${r.ok ? "✓" : "✗"} ${id} (${Math.round((Date.now() - started) / 1000)}s, $${spent.toFixed(2)} so far)${r.ok ? "" : `: ${r.issues.length} issue(s), saved to _needs-review`}`);
      } catch (e) {
        failed.push(id);
        console.log(`✗ ${id}: ${e instanceof Error ? e.message : e}`);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, todo.length) }, worker));
  console.log(`\nDone: ${passed} written, ${failed.length} need review${failed.length ? ` (${failed.join(", ")})` : ""}. Spent about $${spent.toFixed(2)}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
