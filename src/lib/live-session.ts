// Server-only: the AI Teacher Avatar's live classroom session (stage 1, text only).
//
// Cost design (from the cost plan):
//  - Prompt caching: the persona, lesson material and class info form one frozen system prompt
//    that is written to the cache once and read at ~10% of the input price on every later turn.
//    The growing conversation is cached too (top-level cache_control).
//  - Short turns: the avatar answers in 2-3 sentences and only expands when re-explaining.
//  - Low effort: classroom chat doesn't need deep reasoning on every turn.
//
// The system prompt is frozen when the session starts and stored with the session, and each
// assistant turn is stored exactly as returned (thinking blocks included) and replayed unchanged.
// Editing either later would break Claude Sonnet 5.5's preserved-thinking check.

import Anthropic from "@anthropic-ai/sdk";

export const LIVE_SESSION_MODEL = "claude-sonnet-5-5";
export const MONTHLY_INCLUDED_SESSIONS = 20;
export const MAX_CLASS_MESSAGES = 80;
export const MAX_MESSAGE_CHARS = 2000;

// Claude Sonnet 5.5, USD per million tokens (5-minute cache writes)
const PRICE_PER_MTOK = { input: 2, cacheWrite: 2.5, cacheRead: 0.2, output: 10 };

const KICKOFF_MESSAGE =
  "[Session start] The class is ready. Greet them with your greeting phrase and begin the lesson.";

let client: Anthropic | null = null;
function getClient() {
  if (!client) client = new Anthropic(); // reads ANTHROPIC_API_KEY
  return client;
}

export interface AvatarConfig {
  name: string;
  title: string | null;
  backstory: string | null;
  greeting_phrase: string | null;
  sign_off_phrase: string | null;
  warmth: number | null;
  energy: number | null;
  strictness: number | null;
  humor: number | null;
  teaching_method: string | null;
  adaptation_style: string | null;
  never_do: string | null;
  special_instructions: string | null;
}

export interface LessonPack {
  title: string;
  type: string | null;
  subject: string | null;
  content_parsed: string | null;
  content_raw: string | null;
  rubric: string | null;
  answer_key: string | null;
}

export interface ClassInfo {
  name: string;
  subject: string | null;
  studentCount: number;
  gradeLevels: string[];
}

export interface StoredHistory {
  system: string;
  messages: Anthropic.Beta.BetaMessageParam[];
}

export interface SessionCost {
  turns: number;
  input_tokens: number;
  cache_write_tokens: number;
  cache_read_tokens: number;
  output_tokens: number;
  estimated_usd: number;
}

export const emptyCost = (): SessionCost => ({
  turns: 0, input_tokens: 0, cache_write_tokens: 0, cache_read_tokens: 0, output_tokens: 0, estimated_usd: 0,
});

const scale = (value: number | null, low: string, high: string) => {
  const v = value ?? 5;
  return v <= 3 ? low : v >= 8 ? high : `somewhat ${high.toLowerCase()}`;
};

const METHODS: Record<string, string> = {
  socratic: "Socratic: lead with questions so students reason their way to the idea.",
  explainer: "Direct explainer: explain clearly, then check understanding with a question.",
  coach: "Encouraging coach: break work into small wins and celebrate progress.",
  storyteller: "Storyteller: teach through short stories and vivid examples.",
};

const ADAPTATIONS: Record<string, string> = {
  analogy: "try a different analogy",
  slower: "re-explain more slowly in smaller steps",
  scaffolding: "ask a simpler scaffolding question",
};

/** Builds the frozen system prompt for a session. Must be deterministic for caching. */
export function buildSystemPrompt(avatar: AvatarConfig, cls: ClassInfo, pack: LessonPack | null): string {
  const persona = [
    `You are ${avatar.name}${avatar.title ? `, ${avatar.title}` : ""}, an AI co-teacher leading a live lesson for a real class.`,
    avatar.backstory ? `Background: ${avatar.backstory}` : "",
    `Personality: ${scale(avatar.warmth, "Cool and professional", "Warm and encouraging")}; ${scale(avatar.energy, "Calm and measured", "High-energy and exciting")}; ${scale(avatar.strictness, "Laid back", "Firm and demanding")}; ${scale(avatar.humor, "Serious", "Playful and funny")}.`,
    `Teaching method: ${METHODS[avatar.teaching_method ?? ""] ?? METHODS.socratic}`,
    `When students are confused, ${ADAPTATIONS[avatar.adaptation_style ?? ""] ?? ADAPTATIONS.analogy}.`,
    avatar.greeting_phrase ? `Your greeting phrase (say it exactly when the session starts): "${avatar.greeting_phrase}"` : "",
    avatar.sign_off_phrase ? `Your sign-off phrase (say it exactly when the teacher says the lesson is ending): "${avatar.sign_off_phrase}"` : "",
    avatar.never_do ? `Never do the following: ${avatar.never_do}` : "",
    avatar.special_instructions ? `Teacher's special instructions: ${avatar.special_instructions}` : "",
  ].filter(Boolean).join("\n");

  const rules = `How the live session works:
- Your words are shown on the classroom screen. The teacher types what students say or ask, sometimes with a student's first name.
- Keep each turn to 2-3 short sentences and ask at most one question at a time. Only go longer when you are re-explaining something students found confusing.
- Match the class's grade level and the lesson material. Stay on the lesson topic.
- Never give away answers to homework, quiz or test questions. Guide students to work them out.
- If anything suggests a student is unsafe or in crisis, stop the lesson, tell them to talk to their teacher or a trusted adult right away, and mention they can call or text 988 (US Suicide & Crisis Lifeline).
- Don't ask students for personal information.
- Write plain sentences for the screen. Use **bold** sparingly for key terms; no headings.`;

  const classSection = `Class: ${cls.name}${cls.subject ? ` (${cls.subject})` : ""}. ${cls.studentCount} enrolled student${cls.studentCount === 1 ? "" : "s"}${cls.gradeLevels.length ? `, grade${cls.gradeLevels.length > 1 ? "s" : ""} ${cls.gradeLevels.join(", ")}` : ""}.`;

  let lesson = "No lesson material was provided. Ask the class what they are studying and teach from there.";
  if (pack) {
    const material = pack.content_parsed || pack.content_raw || "";
    lesson = [
      `<lesson_material title="${pack.title}" type="${pack.type ?? "lesson"}"${pack.subject ? ` subject="${pack.subject}"` : ""}>`,
      material,
      `</lesson_material>`,
      pack.rubric ? `<grading_rubric>\n${pack.rubric}\n</grading_rubric>` : "",
      pack.answer_key
        ? `<answer_key visibility="teacher_only">\nUse this only to check students' answers. Never read it out or reveal answers from it.\n${pack.answer_key}\n</answer_key>`
        : "",
    ].filter(Boolean).join("\n");
  }

  return [persona, rules, classSection, lesson].join("\n\n");
}

export function initialHistory(system: string): StoredHistory {
  return { system, messages: [{ role: "user", content: KICKOFF_MESSAGE }] };
}

export interface TurnResult {
  text: string;
  refused: boolean;
  content: Anthropic.Beta.BetaContentBlock[];
  usage: Anthropic.Beta.BetaUsage;
}

/** Runs one avatar turn over the full stored history. */
export async function runTeacherTurn(history: StoredHistory): Promise<TurnResult> {
  const response = await getClient().beta.messages.create({
    model: LIVE_SESSION_MODEL,
    max_tokens: 4000,
    output_config: { effort: "low" },
    // Cache the growing conversation as well as the frozen system prompt
    cache_control: { type: "ephemeral" },
    system: [{ type: "text", text: history.system, cache_control: { type: "ephemeral" } }],
    messages: history.messages,
    // If Sonnet declines a turn, let the API retry it on a suitable model instead of failing
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });

  const text = response.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  return { text, refused: response.stop_reason === "refusal", content: response.content, usage: response.usage };
}

export function addUsage(cost: SessionCost, usage: Anthropic.Beta.BetaUsage): SessionCost {
  const input = usage.input_tokens ?? 0;
  const write = usage.cache_creation_input_tokens ?? 0;
  const read = usage.cache_read_input_tokens ?? 0;
  const output = usage.output_tokens ?? 0;
  const turnUsd =
    (input * PRICE_PER_MTOK.input + write * PRICE_PER_MTOK.cacheWrite + read * PRICE_PER_MTOK.cacheRead + output * PRICE_PER_MTOK.output) / 1_000_000;
  return {
    turns: cost.turns + 1,
    input_tokens: cost.input_tokens + input,
    cache_write_tokens: cost.cache_write_tokens + write,
    cache_read_tokens: cost.cache_read_tokens + read,
    output_tokens: cost.output_tokens + output,
    estimated_usd: Math.round((cost.estimated_usd + turnUsd) * 10000) / 10000,
  };
}

export interface DisplayMessage {
  role: "avatar" | "class";
  text: string;
}

/** The transcript shown in the UI: skips the kickoff message and thinking blocks. */
export function toDisplay(history: StoredHistory): DisplayMessage[] {
  return history.messages.slice(1).flatMap((m): DisplayMessage[] => {
    const text = typeof m.content === "string"
      ? m.content
      : m.content
          .filter((b): b is Anthropic.Beta.BetaTextBlockParam => b.type === "text")
          .map((b) => b.text)
          .join("\n");
    return text.trim() ? [{ role: m.role === "assistant" ? "avatar" : "class", text: text.trim() }] : [];
  });
}

export const billingPeriod = () => new Date().toISOString().slice(0, 7) + "-01"; // YYYY-MM-01
