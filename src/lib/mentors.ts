// The Study Buddy mentors: four original cartoon professors a student picks to guide them through
// the textbook. Shared by the browser (drawing, picker, voice) and the server (the mentor's voice in
// prompts).
//
// Design choices come from research on teaching characters (pedagogical agents) and Mayer's
// multimedia learning principles:
// - Embodiment and signaling: the professor looks at and points to the page while explaining, which
//   guides attention to the material (a character that only smiles at the student doesn't help).
// - Coherence: little motion while a page is read, so the character doesn't pull attention away.
// - Growth mindset feedback: praise effort and strategy, never "you're smart"; mistakes are "not yet".
// - Personalization and politeness: warm, conversational "you / we / let's" language.
// - Simple, stylized faces (no near-realistic faces) to stay friendly, with adult features.
// - Voice: each professor reads with a matching voice when the device has one.
// - Autonomy: the student chooses their professor.

export type MentorId = "rivera" | "okafor" | "chen" | "hughes";

export interface Mentor {
  id: MentorId;
  /** What students call them. */
  name: string;
  /** Who they are, for the AI. */
  about: string;
  /** One line for the picker. */
  tagline: string;
  /** How the mentor talks, for the AI. */
  voice: string;
  /** Which kind of browser voice reads for them. */
  voiceHint: "female" | "male";
  /** Main and accent colors for the drawing and the speech bubble. */
  color: string;
  accent: string;
}

export const MENTORS: Mentor[] = [
  {
    id: "rivera", name: "Professor Rivera", color: "#E2574C", accent: "#FDE2DF", voiceHint: "female",
    about: "a warm, curious math professor who loves puzzles",
    tagline: "Warm and curious. She turns every problem into a puzzle.",
    voice: "warm and curious; asks \"What do you notice?\" and loves a good puzzle",
  },
  {
    id: "okafor", name: "Dr. Okafor", color: "#0F8B8D", accent: "#D5F2F2", voiceHint: "male",
    about: "a calm, clear math professor who explains things step by step",
    tagline: "Calm and clear. He breaks every problem into small steps.",
    voice: "calm and clear; uses numbered steps and says \"Step by step, we've got this.\"",
  },
  {
    id: "chen", name: "Professor Chen", color: "#3F8F4E", accent: "#DDF3E1", voiceHint: "female",
    about: "a patient math professor who never rushes",
    tagline: "Patient and kind. She'll go over it as many times as you need.",
    voice: "gentle and patient; never rushes and reminds students that mistakes help their brain grow",
  },
  {
    id: "hughes", name: "Professor Hughes", color: "#6D4FC2", accent: "#E9E3FA", voiceHint: "male",
    about: "a cheerful, experienced math professor who gets excited about math",
    tagline: "Cheerful and full of fun math facts. He celebrates every bit of progress.",
    voice: "cheerful and encouraging; shares a quick fun fact now and then and celebrates effort",
  },
];

export const MENTORS_BY_ID: Record<MentorId, Mentor> = Object.fromEntries(MENTORS.map((m) => [m.id, m])) as Record<MentorId, Mentor>;

export const isMentorId = (v: unknown): v is MentorId => typeof v === "string" && v in MENTORS_BY_ID;

/** How a class's lessons are taught, chosen by the teacher. */
export type TeachingMode = "mentor" | "teacher" | "ai_teacher";
export const TEACHING_MODES: { id: TeachingMode; label: string; description: string }[] = [
  { id: "mentor", label: "Personal mentor", description: "Each student reads the textbook with their own mentor, at their own pace." },
  { id: "teacher", label: "I'll teach", description: "You teach the lesson. Students can read the textbook, but the mentor stays quiet." },
  { id: "ai_teacher", label: "AI Teacher teaches the class", description: "Start a Live Session from a textbook lesson and your AI Teacher leads the class." },
];
export const isTeachingMode = (v: unknown): v is TeachingMode => v === "mentor" || v === "teacher" || v === "ai_teacher";
