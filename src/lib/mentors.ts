// The Study Buddy mentors: original cartoon tutors a student picks to guide them through the
// textbook. Shared by the browser (drawing, picker) and the server (the mentor's voice in prompts).

export type MentorId = "maya" | "leo" | "sam" | "zoe";

export interface Mentor {
  id: MentorId;
  name: string;
  /** Who they are, for the AI ("a friendly cartoon tutor who ..."). */
  about: string;
  /** One line for the picker. */
  tagline: string;
  /** How the mentor talks, for the AI. */
  voice: string;
  /** Main and accent colors for the drawing and the speech bubble. */
  color: string;
  accent: string;
}

export const MENTORS: Mentor[] = [
  {
    id: "maya", name: "Maya", color: "#F97316", accent: "#FED7AA",
    about: "a curious tutor who loves puzzles",
    tagline: "Curious and quick. She loves a good puzzle.",
    voice: "upbeat and curious, uses short sentences, sometimes says \"Let's figure it out!\"",
  },
  {
    id: "leo", name: "Leo", color: "#14B8A6", accent: "#CCFBF1",
    about: "a calm tutor who explains things step by step",
    tagline: "Calm and clear. He explains things step by step.",
    voice: "calm and clear, likes numbered steps, sometimes says \"Step by step, we've got this.\"",
  },
  {
    id: "sam", name: "Sam", color: "#22C55E", accent: "#DCFCE7",
    about: "a patient tutor who never rushes",
    tagline: "Patient and kind. Slow and steady wins!",
    voice: "gentle and patient, never rushes, reminds students that mistakes help them learn",
  },
  {
    id: "zoe", name: "Zoe", color: "#8B5CF6", accent: "#EDE9FE",
    about: "a cheerful tutor who gets excited about math",
    tagline: "Cheerful and excited about math. She celebrates every win.",
    voice: "enthusiastic and encouraging, celebrates every bit of progress",
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
