import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/api-auth";
import { getAdminClient } from "@/lib/usage";

// Roster + gradebook for a class: students, their recent AI activity, and assignment scores
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireTeacher(req);
    if (auth.error) return auth.error;
    const { id: classId } = await params;
    const supabase = getAdminClient();

    const { data: cls } = await supabase.from("classes").select("teacher_id").eq("id", classId).maybeSingle();
    if (!cls || cls.teacher_id !== auth.user.id) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const { data: enrollments } = await supabase.from("enrollments").select("student_id").eq("class_id", classId);
    const studentIds = (enrollments ?? []).map((e) => e.student_id);

    const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const [{ data: profiles }, { data: activity }, { data: packs }, { data: submissions }] = await Promise.all([
      studentIds.length
        ? supabase.from("profiles").select("id, display_name, grade_level, tier, role").in("id", studentIds)
        : Promise.resolve({ data: [] as { id: string; display_name: string | null; grade_level: string | null; tier: string | null; role: string | null }[] }),
      studentIds.length
        ? supabase.from("ai_interactions").select("user_id, created_at").in("user_id", studentIds).gte("created_at", weekAgo).limit(5000)
        : Promise.resolve({ data: [] as { user_id: string; created_at: string }[] }),
      supabase.from("context_packs").select("id, title, type, due_date, created_at")
        .eq("class_id", classId).in("type", ["homework", "quiz"]).order("created_at", { ascending: true }),
      supabase.from("assignment_submissions").select("id, context_pack_id, student_id, status, score, graded_by, submitted_at").eq("class_id", classId),
    ]);

    const activityByStudent = new Map<string, { count: number; last: string }>();
    for (const a of activity ?? []) {
      const entry = activityByStudent.get(a.user_id) ?? { count: 0, last: a.created_at };
      entry.count += 1;
      if (a.created_at > entry.last) entry.last = a.created_at;
      activityByStudent.set(a.user_id, entry);
    }

    // College students' AI activity is private
    const students = (profiles ?? [])
      .map((p) => {
        const isPrivate = p.role === "college";
        return {
          id: p.id,
          name: p.display_name || "Student",
          grade_level: p.grade_level,
          tier: p.tier ?? "free",
          private: isPrivate,
          ai_requests_this_week: isPrivate ? null : activityByStudent.get(p.id)?.count ?? 0,
          last_active: isPrivate ? null : activityByStudent.get(p.id)?.last ?? null,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ students, assignments: packs ?? [], submissions: submissions ?? [] });
  } catch (error) {
    console.error("Class students API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
