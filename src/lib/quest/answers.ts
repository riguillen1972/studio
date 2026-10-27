// Checking answers. Numeric answers accept any equivalent form a student might type:
// 3/4, 6/8, 0.75, .75, 1 1/2, 3/2, -2, −2, ¾, $12.50, 40%.

export interface QuestChoice {
  text: string;
  correct?: boolean;
  misconception?: string;
}

export interface QuestItem {
  id: string;
  skill_id: string;
  difficulty: number;
  kind: "multiple_choice" | "numeric";
  stem: string;
  choices: QuestChoice[] | null;
  answer: string;
  explanation: string;
}

const UNICODE_FRACTIONS: Record<string, string> = {
  "½": "1/2", "⅓": "1/3", "⅔": "2/3", "¼": "1/4", "¾": "3/4", "⅕": "1/5", "⅖": "2/5",
  "⅗": "3/5", "⅘": "4/5", "⅙": "1/6", "⅚": "5/6", "⅛": "1/8", "⅜": "3/8", "⅝": "5/8", "⅞": "7/8",
};

/** Parses a number written as an integer, decimal, fraction, mixed number or percent. Returns null if it isn't one. */
export function parseNumber(raw: string): number | null {
  let s = raw.trim().toLowerCase()
    .replace(/[−–—]/g, "-")
    .replace(/[$,\s]+(?=\d)/g, (m) => (m.includes(" ") ? " " : ""))
    .replace(/^\$/, "")
    .replace(/\$/g, "");
  for (const [u, f] of Object.entries(UNICODE_FRACTIONS)) s = s.replace(u, ` ${f}`);
  s = s.replace(/\s+/g, " ").trim();

  let percent = false;
  if (s.endsWith("%")) {
    percent = true;
    s = s.slice(0, -1).trim();
  }

  let value: number | null = null;
  const mixed = /^(-?)(\d+) (\d+)\/(\d+)$/.exec(s);
  const fraction = /^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/.exec(s);
  if (mixed) {
    const [, sign, whole, num, den] = mixed;
    if (Number(den) === 0) return null;
    value = (Number(whole) + Number(num) / Number(den)) * (sign ? -1 : 1);
  } else if (fraction) {
    if (Number(fraction[2]) === 0) return null;
    value = Number(fraction[1]) / Number(fraction[2]);
  } else if (/^-?(\d+\.?\d*|\.\d+)$/.test(s)) {
    value = Number(s);
  }
  if (value === null || !Number.isFinite(value)) return null;
  return percent ? value / 100 : value;
}

const normalizeText = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "").replace(/[−–—]/g, "-");

export interface CheckResult {
  correct: boolean;
  /** For multiple choice: the misconception tagged on the chosen wrong answer. */
  misconception: string | null;
}

/** Checks a response against an item. For numbers, equal values count (3/4 = 0.75 = 6/8). */
export function checkAnswer(item: Pick<QuestItem, "kind" | "choices" | "answer">, response: string): CheckResult {
  if (item.kind === "multiple_choice" && item.choices?.length) {
    const chosen = item.choices.find((c) => normalizeText(c.text) === normalizeText(response));
    if (!chosen) return { correct: false, misconception: null };
    return { correct: !!chosen.correct, misconception: chosen.correct ? null : chosen.misconception ?? null };
  }

  // "x = 5", "x=5" and "5" are the same answer
  const stripVariable = (v: string) => v.trim().replace(/^[a-z]\s*=\s*/i, "");
  const expected = parseNumber(stripVariable(item.answer));
  const given = parseNumber(stripVariable(response));
  if (expected !== null && given !== null) {
    // Also accept "40" for an answer of "40%"
    const percentMatch = item.answer.trim().endsWith("%") && Math.abs(given - expected * 100) < 1e-6;
    return { correct: Math.abs(given - expected) < 1e-6 || percentMatch, misconception: null };
  }
  return { correct: normalizeText(item.answer) === normalizeText(response), misconception: null };
}
