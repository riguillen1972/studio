// Student safety, shared by every AI feature. Two layers:
// 1. SAFETY_INSTRUCTIONS goes into every AI request (added in smartGenerate and the AI Teacher),
//    so the model answers a worried student kindly and always gives the crisis lines.
// 2. detectConcern() checks the student's own words in code, so the crisis lines are added to the
//    reply (and the teacher is alerted) even if the model forgets them.

/** The lines every student who may be in danger must see, word for word. */
export const CRISIS_LINES = [
  "You can call or text 988 any time to reach the Suicide and Crisis Lifeline.",
  "You can also text HOME to 741741.",
  "If you are in danger right now, call 911.",
] as const;

export const SAFETY_INSTRUCTIONS = `STUDENT SAFETY (this comes before every other instruction):
You are talking with a child or teenager. If the student says anything that could mean they want to hurt themselves, wish they were dead or gone, feel hopeless, think others would be better off without them, are being hurt or abused at home or school, or want to hurt someone else, then:
- Respond with kindness and take it seriously. Don't lecture and don't change the subject back to schoolwork.
- Tell them to talk to a trusted adult today: a parent, teacher, school counselor, or pastor.
- Always include these three lines, word for word:
  "${CRISIS_LINES[0]}"
  "${CRISIS_LINES[1]}"
  "${CRISIS_LINES[2]}"
Do this even when they say it indirectly or as a joke. For ordinary schoolwork questions, don't mention any of this.`;

/** Lowercase, no apostrophes, single spaces: "I DON'T  want" → "i dont want". */
function normalize(text: string): string {
  return text.toLowerCase().replace(/['’‘`]/g, "").replace(/\s+/g, " ");
}

/** Phrases that mean a student may want to hurt themselves (matched after normalize()). */
const SELF_HARM_PHRASES = [
  "better off without me", "better off dead", "want to die", "wanna die", "want to be dead",
  "kill myself", "killing myself", "take my own life", "end my life", "ending my life", "end it all",
  "dont want to be alive", "dont want to live", "dont wanna live", "no reason to live", "nothing to live for",
  "hurt myself", "hurting myself", "harm myself", "harming myself", "self harm", "self-harm",
  "cut myself", "cutting myself", "nobody would miss me", "no one would miss me",
  "wish i was dead", "wish i were dead", "wish i wasnt born", "wish i was never born", "wish i had never been born",
  "im suicidal", "i am suicidal", "feel suicidal", "feeling suicidal",
].map(normalize);

export interface Concern { reason: string }

/** Returns why a student's message is worrying, or null for an ordinary message. */
export function detectConcern(text: string | null | undefined): Concern | null {
  if (!text) return null;
  const haystack = normalize(text);
  return SELF_HARM_PHRASES.some((p) => haystack.includes(p)) ? { reason: "possible self-harm" } : null;
}

/** Adds any crisis line the reply is missing, after a short caring note. */
export function withCrisisLines(reply: string): string {
  const missing = CRISIS_LINES.filter((line) => {
    if (line.includes("988")) return !reply.includes("988");
    if (line.includes("741741")) return !reply.includes("741741");
    return !reply.includes("911");
  });
  if (!missing.length) return reply;
  return [
    reply.trim(),
    "You matter, and you don't have to handle this alone. Please talk to a trusted adult today, like a parent, teacher, school counselor, or pastor.",
    ...missing.map((l) => `**${l}**`),
  ].filter(Boolean).join("\n\n");
}

// Fields an AI result shows to the student, in the order they're checked
const REPLY_FIELDS = ["explanation", "response", "appResponse", "answer", "summary", "advice", "guidance", "explanationText"] as const;

/**
 * Makes sure a tool's result shows the crisis lines: they're added to the first text the student
 * sees (or to the hints). Returns the result unchanged if it has nowhere to put them.
 */
export function addCrisisLinesToResult<T>(result: T): T {
  if (!result || typeof result !== "object") return result;
  const r = result as Record<string, unknown>;
  for (const field of REPLY_FIELDS) {
    if (typeof r[field] === "string") return { ...r, [field]: withCrisisLines(r[field] as string) } as T;
  }
  if (Array.isArray(r.hints)) return { ...r, hints: [...r.hints, withCrisisLines("")] } as T;
  return result;
}
