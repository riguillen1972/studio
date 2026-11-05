// The shape of a Math Quest lesson, shared by the server (generation) and the browser (display).

export interface LessonExample { problem: string; steps: string[]; answer: string }

export interface LessonContent {
  title: string;
  /** One or two sentences on where this shows up in real life. */
  why: string;
  vocabulary: { term: string; meaning: string }[];
  /** The key idea, in 2–4 short paragraphs (Markdown bold allowed). */
  explain: string[];
  examples: LessonExample[];
  /** The most common mistake and how to avoid it. */
  watch_out: string;
  /** A brief, natural faith connection, or null when none fits. */
  faith: string | null;
  /** One quick question to try before practicing; the answer is a number. */
  check: { question: string; answer: string; hint: string };
}
