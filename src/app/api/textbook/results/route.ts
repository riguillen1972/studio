import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/usage";
import { unauthorized, userIdFrom } from "@/lib/quest/api";
import { getSkill } from "@/lib/quest/skills";
import { gradeLesson } from "@/lib/textbook-grade";
import { lessonForStudent } from "@/lib/textbook-load";

// The signed-in student's finished textbook lessons: [{ skill_id, score, best_score, attempts, completed_at }]
export async function GET(req: NextRequest) {
  const userId = await userIdFrom(req);
  if (!userId) return unauthorized();
  const { data, error } = await getAdminClient()
    .from("textbook_results")
    .select("skill_id, score, best_score, attempts, completed_at")
    .eq("student_id", userId);
  if (error) {
    console.error("Loading textbook results failed:", error);
    return NextResponse.json({ results: [] });
  }
  return NextResponse.json({ results: data ?? [] });
}

// A student finished a lesson: { skill_id, responses: string[][] } (the answers tried for each
// graded problem, in order). The server grades them itself and saves the result.
export async function POST(req: NextRequest) {
  const userId = await userIdFrom(req);
  if (!userId) return unauthorized();
  const supabase = getAdminClient();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (profile?.role === "teacher") return NextResponse.json({ error: "Teachers preview lessons; only students' work is graded" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const skill = typeof body?.skill_id === "string" ? getSkill(body.skill_id) : undefined;
  if (!skill) return NextResponse.json({ error: "Unknown lesson" }, { status: 404 });
  const lesson = await lessonForStudent(skill.id);
  if (!lesson) return NextResponse.json({ error: "This lesson isn't available" }, { status: 404 });

  const grade = gradeLesson(lesson, body.responses);
  if (!grade) return NextResponse.json({ error: "Those answers don't match this lesson's problems" }, { status: 400 });

  const { data: before } = await supabase
    .from("textbook_results").select("best_score, attempts").eq("student_id", userId).eq("skill_id", skill.id).maybeSingle();
  const row = {
    student_id: userId,
    skill_id: skill.id,
    score: grade.score,
    points: grade.points,
    total: grade.total,
    answers: grade.problems,
    best_score: Math.max(grade.score, before?.best_score ?? 0),
    attempts: (before?.attempts ?? 0) + 1,
    completed_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("textbook_results").upsert(row, { onConflict: "student_id,skill_id" });
  if (error) {
    console.error("Saving textbook result failed:", error);
    return NextResponse.json({ error: "Couldn't save your grade. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ result: { skill_id: skill.id, score: grade.score, best_score: row.best_score, attempts: row.attempts, completed_at: row.completed_at, points: grade.points, total: grade.total } });
}
