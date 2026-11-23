// The Study Buddy mentors: original characters a student picks to guide them through the
// textbook. Shared by the browser (drawing, picker) and the server (the mentor's voice in prompts).

export type MentorId = "pip" | "bolt" | "shelly" | "nova";

export interface Mentor {
  id: MentorId;
  name: string;
  animal: string;
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
    id: "pip", name: "Pip", animal: "fox", color: "#F97316", accent: "#FDBA74",
    tagline: "A quick, curious fox who loves a good puzzle.",
    voice: "upbeat and curious, uses short sentences, sometimes says \"Let's figure it out!\"",
  },
  {
    id: "bolt", name: "Bolt", animal: "robot", color: "#14B8A6", accent: "#99F6E4",
    tagline: "A friendly robot who explains things step by step.",
    voice: "calm and clear, likes numbered steps, sometimes says \"Step by step, we've got this.\"",
  },
  {
    id: "shelly", name: "Shelly", animal: "turtle", color: "#22C55E", accent: "#BBF7D0",
    tagline: "A patient turtle. Slow and steady wins!",
    voice: "gentle and patient, never rushes, reminds students that mistakes help them learn",
  },
  {
    id: "nova", name: "Nova", animal: "little dragon", color: "#8B5CF6", accent: "#DDD6FE",
    tagline: "A cheerful little dragon who gets excited about math.",
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
