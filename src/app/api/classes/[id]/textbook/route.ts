import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/api-auth";
import { getAdminClient } from "@/lib/usage";
import { cleanAssignments } from "@/lib/textbook-assign";

// For the class's teacher: the textbook lessons assigned to the class, and how many of the
// class's students have opened each one.
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
  return NextResponse.json({ assigned, opened, students: studentIds.length });
}
