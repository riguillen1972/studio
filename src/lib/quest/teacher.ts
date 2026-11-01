// Server-only: checks that the signed-in teacher owns a class, for Math Quest teacher routes.

import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/api-auth";
import { getAdminClient } from "@/lib/usage";

export async function ownQuestClass(req: NextRequest, classId: string) {
  const auth = await requireTeacher(req);
  if (auth.error) return { error: auth.error };
  const { data: cls } = await getAdminClient().from("classes").select("id, name, teacher_id").eq("id", classId).maybeSingle();
  if (!cls || cls.teacher_id !== auth.user.id) return { error: NextResponse.json({ error: "Class not found" }, { status: 404 }) };
  return { cls, teacherId: auth.user.id };
}

/** Enrolled students in grades 6–8 (the ones Math Quest covers). */
export async function questStudentIds(classId: string): Promise<string[]> {
  const supabase = getAdminClient();
  const { data: enrollments } = await supabase.from("enrollments").select("student_id").eq("class_id", classId);
  const ids = (enrollments ?? []).map((e) => e.student_id);
  if (!ids.length) return [];
  const { data: profiles } = await supabase.from("profiles").select("id, role, grade_level").in("id", ids);
  return (profiles ?? []).filter((p) => p.role === "k12" && Number(p.grade_level) >= 6 && Number(p.grade_level) <= 8).map((p) => p.id);
}
