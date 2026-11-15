// Server-only: the teacher's lesson material for a student's class, added to AI requests so the
// tutor talks about the real lesson instead of guessing. Only lesson and homework packs are used,
// and never their answer keys or rubrics.

import { getAdminClient } from "@/lib/usage";

const MAX_PACKS = 4;
const MAX_PER_PACK = 3000; // characters
const MAX_TOTAL = 8000;

/** The material as one block of text, or null if the student isn't in a class or it has none. */
export async function lessonMaterialFor(userId: string): Promise<string | null> {
  try {
    const supabase = getAdminClient();
    const { data: enrollments } = await supabase.from("enrollments").select("class_id").eq("student_id", userId);
    const classIds = (enrollments ?? []).map((e) => e.class_id);
    if (!classIds.length) return null;

    const { data: packs } = await supabase.from("context_packs")
      .select("title, subject, type, content_parsed, content_raw")
      .in("class_id", classIds).in("type", ["lesson", "homework"])
      .order("created_at", { ascending: false }).limit(MAX_PACKS);
    if (!packs?.length) return null;

    let total = 0;
    const parts: string[] = [];
    for (const p of packs) {
      // A teacher's raw homework text might include the answers, so homework uses the parsed version only
      const body = (p.content_parsed || (p.type === "lesson" ? p.content_raw : "") || "").trim().slice(0, MAX_PER_PACK);
      if (!body) continue;
      const part = `### ${p.title}${p.subject ? ` (${p.subject})` : ""}${p.type === "homework" ? " [homework: guide, don't give answers]" : ""}\n${body}`;
      if (total + part.length > MAX_TOTAL) break;
      parts.push(part);
      total += part.length;
    }
    return parts.length ? parts.join("\n\n") : null;
  } catch (e) {
    console.error("Couldn't load lesson material:", e);
    return null;
  }
}

/** The prompt section for a flow, or "" when there's no material. */
export function lessonMaterialSection(material: string | undefined | null): string {
  if (!material) return "";
  return `\n\nYOUR TEACHER'S LESSON MATERIAL (from the student's class). When the student mentions their class, a lesson, a field trip or an assignment, use these facts and quote numbers and names exactly. Don't add details that aren't here.\n"""\n${material}\n"""\n`;
}
