import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/api-auth";
import { getAdminClient } from "@/lib/usage";
import { cleanAssignments } from "@/lib/textbook-assign";

// For the class's teacher: the textbook lessons assigned to the class, how many students opened
// each one, and the grades of students who finished them:
// { assigned, opened: {skill: n}, done: {skill: {count, average}}, results: [{student_id, name, skill_id, score, best_score, attempts, completed_at}], students }
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTeacher(req);
  if (auth.error) return auth.error;
  const { id } = await params;
  const supabase = getAdminClient();

  const { data: cls } = await supabase.from("classes").select("teacher_id, settings").eq("id", id).maybeSingle();
  if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });
  if (cls.teacher_id !== auth.user.id) return NextResponse.json({ error: "Not your class" }, { status: 403 });

  const assigned = cleanAssignments(cls.settings?.assigned_lessons) ?? [];
  const { data: enrollments } = await supabase.from("enrollments").select("student_id").eq("class_id", id);
  const studentIds = (enrollments ?? []).map((e) => e.student_id);

  const opened: Record<string, number> = {};
  if (assigned.length && studentIds.length) {
    const { data: views } = await supabase
      .from("quest_lesson_views")
      .select("skill_id")
      .in("student_id", studentIds)
      .in("skill_id", assigned.map((a) => a.skill_id));
    for (const v of views ?? []) opened[v.skill_id] = (opened[v.skill_id] ?? 0) + 1;
  }
  // Grades for the assigned lessons (a student who did a lesson before it was assigned still counts)
  const done: Record<string, { count: number; average: number }> = {};
  let results: { student_id: string; name: string; skill_id: string; score: number; best_score: number; attempts: number; completed_at: string }[] = [];
  if (assigned.length && studentIds.length) {
    const [{ data: rows }, { data: profiles }] = await Promise.all([
      supabase.from("textbook_results")
        .select("student_id, skill_id, score, best_score, attempts, completed_at")
        .in("student_id", studentIds)
        .in("skill_id", assigned.map((a) => a.skill_id)),
      supabase.from("profiles").select("id, display_name").in("id", studentIds),
    ]);
    const names = new Map((profiles ?? []).map((p) => [p.id, p.display_name || "Student"]));
    results = (rows ?? []).map((r) => ({ ...r, name: names.get(r.student_id) ?? "Student" }));
    for (const r of results) {
      const d = (done[r.skill_id] ??= { count: 0, average: 0 });
      d.average = (d.average * d.count + r.best_score) / (d.count + 1);
      d.count += 1;
    }
    for (const d of Object.values(done)) d.average = Math.round(d.average);
  }
  return NextResponse.json({ assigned, opened, done, results, students: studentIds.length });
}
