import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/api-auth";
import { getAdminClient } from "@/lib/usage";
import { certificatesFor, questGradeFor } from "@/lib/quest/engine";
import { unauthorized, userIdFrom } from "@/lib/quest/api";
import { parseTzOffset } from "@/lib/quest/progress";

// This week's certificates. ?class_id=… for a teacher's whole class (grades 6–8 students),
// otherwise the signed-in student's own. &tz= is the browser's timezone offset.
export async function GET(req: NextRequest) {
  const tz = parseTzOffset(req.nextUrl.searchParams.get("tz"));
  const classId = req.nextUrl.searchParams.get("class_id");

  if (classId) {
    const auth = await requireTeacher(req);
    if (auth.error) return auth.error;
    const supabase = getAdminClient();
    const { data: cls } = await supabase.from("classes").select("id, name, teacher_id").eq("id", classId).maybeSingle();
    if (!cls || cls.teacher_id !== auth.user.id) return NextResponse.json({ error: "Class not found" }, { status: 404 });
    const { data: enrollments } = await supabase.from("enrollments").select("student_id").eq("class_id", classId);
    const ids = (enrollments ?? []).map((e) => e.student_id);
    const { data: profiles } = ids.length
      ? await supabase.from("profiles").select("id, role, grade_level").in("id", ids)
      : { data: [] as { id: string; role: string; grade_level: string | null }[] };
    const eligible = (profiles ?? []).filter((p) => p.role === "k12" && Number(p.grade_level) >= 6 && Number(p.grade_level) <= 8).map((p) => p.id);
    return NextResponse.json({ class_name: cls.name, certificates: await certificatesFor(eligible, tz) });
  }

  const userId = await userIdFrom(req);
  if (!userId) return unauthorized();
  if (!(await questGradeFor(getAdminClient(), userId))) return NextResponse.json({ error: "Math Quest is for students in grades 6–8." }, { status: 403 });
  return NextResponse.json({ class_name: null, certificates: await certificatesFor([userId], tz) });
}
