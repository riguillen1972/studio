// Server-only: records K-12 students' AI requests so their teacher can see them.
// Only logged while the student is enrolled in a class; students are told about this when they join.
// College students are never logged: their teachers only see work they turn in.

import { getAdminClient } from "@/lib/usage";
import { detectConcern } from "@/lib/safety";

const MAX_PROMPT = 2000;
const MAX_RESPONSE = 4000;

const PROMPT_FIELDS = ["concept", "problem", "question", "userInput", "topic", "text", "description", "url"] as const;

/** The student's own words in a tool request (what they typed or asked). */
export function promptFrom(input: Record<string, unknown>): string {
  const parts = PROMPT_FIELDS
    .map((f) => input[f])
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0);
  if (typeof input.photoDataUri === "string") parts.push("[photo of homework]");
  return parts.join("\n").slice(0, MAX_PROMPT);
}

function responseFrom(result: Record<string, unknown>): string {
  const text = (["explanation", "response", "appResponse", "answer", "summary", "advice", "verse"] as const)
    .map((f) => result[f])
    .find((v): v is string => typeof v === "string");
  if (text) return text.slice(0, MAX_RESPONSE);

  if (Array.isArray(result.hints)) {
    return [...result.hints.map((h, i) => `${i + 1}. ${h}`), typeof result.guidance === "string" ? result.guidance : ""]
      .join("\n").trim().slice(0, MAX_RESPONSE);
  }
  if (Array.isArray(result.questions)) return `Made a ${result.questions.length}-question quiz.`;
  if (Array.isArray(result.flashcards)) return `Made ${result.flashcards.length} flashcards.`;

  const { totalTokens: _ignored, ...rest } = result;
  return JSON.stringify(rest).slice(0, MAX_RESPONSE);
}

export async function logInteraction(userId: string, tool: string, input: unknown, result: unknown, model?: string) {
  try {
    const supabase = getAdminClient();
    const [{ count }, { data: profile }] = await Promise.all([
      supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("student_id", userId),
      supabase.from("profiles").select("role").eq("id", userId).maybeSingle(),
    ]);
    if (!count || profile?.role === "college") return;

    const prompt = promptFrom((input ?? {}) as Record<string, unknown>);
    const concern = detectConcern(prompt);
    await supabase.from("ai_interactions").insert({
      user_id: userId,
      tool,
      prompt,
      response: responseFrom((result ?? {}) as Record<string, unknown>),
      model: model ?? null,
      flagged: !!concern,
      flag_reason: concern?.reason ?? null,
    });
    if (concern) await notifyTeachersOfConcern(userId);
  } catch (e) {
    console.error("Failed to log AI interaction:", e);
  }
}

/** Tells the teacher of each of the student's classes that a message may need their attention. */
async function notifyTeachersOfConcern(studentId: string) {
  try {
    const supabase = getAdminClient();
    const [{ data: enrollments }, { data: profile }] = await Promise.all([
      supabase.from("enrollments").select("classes(name, teacher_id)").eq("student_id", studentId),
      supabase.from("profiles").select("display_name").eq("id", studentId).maybeSingle(),
    ]);
    const classes = (enrollments ?? [])
      .map((e) => (Array.isArray(e.classes) ? e.classes[0] : e.classes) as { name: string; teacher_id: string } | null)
      .filter((c): c is { name: string; teacher_id: string } => !!c);
    if (!classes.length) return;
    const { error } = await supabase.from("teacher_notifications").insert(classes.map((c) => ({
      teacher_id: c.teacher_id,
      type: "student_concern",
      student_id: studentId,
      student_name: profile?.display_name || "A student",
      class_name: c.name,
    })));
    if (error) console.error("Failed to notify teacher of a concern:", error);
  } catch (e) {
    console.error("Failed to notify teacher of a concern:", e);
  }
}
