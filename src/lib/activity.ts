// Server-only: records K-12 students' AI requests so their teacher can see them.
// Only logged while the student is enrolled in a class; students are told about this when they join.
// College students are never logged: their teachers only see work they turn in.

import { getAdminClient } from "@/lib/usage";

const MAX_PROMPT = 2000;
const MAX_RESPONSE = 4000;

const PROMPT_FIELDS = ["concept", "problem", "question", "userInput", "topic", "text", "description", "url"] as const;

function promptFrom(input: Record<string, unknown>): string {
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

    await supabase.from("ai_interactions").insert({
      user_id: userId,
      tool,
      prompt: promptFrom((input ?? {}) as Record<string, unknown>),
      response: responseFrom((result ?? {}) as Record<string, unknown>),
      model: model ?? null,
    });
  } catch (e) {
    console.error("Failed to log AI interaction:", e);
  }
}
