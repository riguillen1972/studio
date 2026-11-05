import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/usage";
import { getSkill } from "@/lib/quest/skills";
import { generateLesson } from "@/lib/quest/lessons";
import { QUEST_MODEL } from "@/lib/quest/generate";
import { unauthorized, userIdFrom } from "@/lib/quest/api";

export const maxDuration = 120;

async function caller(req: NextRequest) {
  const userId = await userIdFrom(req);
  if (!userId) return null;
  const { data } = await getAdminClient().from("profiles").select("role").eq("id", userId).maybeSingle();
  return { userId, teacher: data?.role === "teacher" };
}

async function lessonRow(skillId: string) {
  const { data } = await getAdminClient().from("quest_lessons").select("content, status, updated_at").eq("skill_id", skillId).maybeSingle();
  return data;
}

// A skill's lesson. Students get it only when it's live (and the view is recorded for their
// teacher); teachers also see hidden lessons. `missing` means none has been written yet.
export async function GET(req: NextRequest, { params }: { params: Promise<{ skill: string }> }) {
  const who = await caller(req);
  if (!who) return unauthorized();
  const skill = getSkill((await params).skill);
  if (!skill) return NextResponse.json({ error: "Unknown skill" }, { status: 404 });

  const row = await lessonRow(skill.id);
  if (!row) return NextResponse.json({ lesson: null, status: null, missing: true });
  if (row.status !== "approved" && !who.teacher) return NextResponse.json({ lesson: null, status: "hidden", missing: false });

  if (!who.teacher) {
    const supabase = getAdminClient();
    const { data: seen } = await supabase.from("quest_lesson_views").select("views").eq("student_id", who.userId).eq("skill_id", skill.id).maybeSingle();
    const now = new Date().toISOString();
    await (seen
      ? supabase.from("quest_lesson_views").update({ views: seen.views + 1, last_viewed_at: now }).eq("student_id", who.userId).eq("skill_id", skill.id)
      : supabase.from("quest_lesson_views").insert({ student_id: who.userId, skill_id: skill.id }));
  }
  return NextResponse.json({ lesson: row.content, status: row.status, missing: false, updated_at: row.updated_at });
}

// Writes the lesson: { force?: true } rewrites an existing one (teachers only). Anyone signed in
// can have a missing lesson written, so the first student to open a skill doesn't hit a dead end.
// Each lesson is written once and shared, so this isn't charged to anyone's allowance.
export async function POST(req: NextRequest, { params }: { params: Promise<{ skill: string }> }) {
  try {
    const who = await caller(req);
    if (!who) return unauthorized();
    const skill = getSkill((await params).skill);
    if (!skill) return NextResponse.json({ error: "Unknown skill" }, { status: 404 });
    const { force } = await req.json().catch(() => ({}));
    if (force && !who.teacher) return NextResponse.json({ error: "Only teachers can rewrite a lesson" }, { status: 403 });

    const existing = await lessonRow(skill.id);
    if (existing && !force) return NextResponse.json({ lesson: existing.content, status: existing.status, added: false });

    const { lesson, totalTokens, issues } = await generateLesson(skill);
    console.log(`Lesson ${skill.id}: ${lesson ? "written" : "failed checks"}, ${totalTokens} tokens`);
    if (!lesson) {
      if (issues) console.log(`Lesson ${skill.id} issues: ${issues.slice(0, 500)}`);
      return NextResponse.json({ error: "The lesson didn't pass the accuracy check. Try again in a moment." }, { status: 422 });
    }

    const supabase = getAdminClient();
    const row = { skill_id: skill.id, content: lesson, status: "approved", model: QUEST_MODEL, created_by: who.userId, updated_at: new Date().toISOString() };
    // Two students can open a new skill at the same moment: the first lesson saved wins
    const { error } = force
      ? await supabase.from("quest_lessons").upsert(row, { onConflict: "skill_id" })
      : await supabase.from("quest_lessons").upsert(row, { onConflict: "skill_id", ignoreDuplicates: true });
    if (error) {
      console.error("Saving lesson failed:", error);
      return NextResponse.json({ error: "Failed to save the lesson" }, { status: 500 });
    }
    const saved = await lessonRow(skill.id);
    return NextResponse.json({ lesson: saved?.content ?? lesson, status: saved?.status ?? "approved", added: true });
  } catch (error) {
    console.error("Lesson build error:", error);
    return NextResponse.json({ error: "Couldn't write this lesson right now." }, { status: 500 });
  }
}

// Teachers hide or show a lesson: { status: "hidden" | "approved" }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ skill: string }> }) {
  const who = await caller(req);
  if (!who) return unauthorized();
  if (!who.teacher) return NextResponse.json({ error: "Only teachers can change lessons" }, { status: 403 });
  const skill = getSkill((await params).skill);
  if (!skill) return NextResponse.json({ error: "Unknown skill" }, { status: 404 });
  const { status } = await req.json().catch(() => ({}));
  if (status !== "hidden" && status !== "approved") return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  const { error } = await getAdminClient().from("quest_lessons").update({ status, updated_at: new Date().toISOString() }).eq("skill_id", skill.id);
  if (error) return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  return NextResponse.json({ status });
}
