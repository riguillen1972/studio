import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/api-auth";
import { getAdminClient } from "@/lib/usage";

// One student's AI chats, saved apps and submitted work, for their teacher
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string; studentId: string }> }) {
  try {
    const auth = await requireTeacher(req);
    if (auth.error) return auth.error;
    const { id: classId, studentId } = await params;
    const supabase = getAdminClient();

    const [{ data: cls }, { data: enrollment }] = await Promise.all([
      supabase.from("classes").select("teacher_id").eq("id", classId).maybeSingle(),
      supabase.from("enrollments").select("joined_at").eq("class_id", classId).eq("student_id", studentId).maybeSingle(),
    ]);
    if (!cls || cls.teacher_id !== auth.user.id || !enrollment) {
      return NextResponse.json({ error: "Student not found in this class" }, { status: 404 });
    }

    // College students' chats and apps are private; their teacher only sees turned-in work
    const { data: profile } = await supabase.from("profiles").select("display_name, grade_level, tier, role").eq("id", studentId).maybeSingle();
    const isPrivate = profile?.role === "college";
    const none = Promise.resolve({ data: [] });

    const [{ data: chats }, { data: apps }, { data: submissions }] = await Promise.all([
      isPrivate ? none : supabase.from("ai_interactions").select("id, tool, prompt, response, created_at")
        .eq("user_id", studentId).order("created_at", { ascending: false }).limit(100),
      isPrivate ? none : supabase.from("saved_apps").select("id, name, description, conversation, created_at")
        .eq("user_id", studentId).order("created_at", { ascending: false }).limit(50),
      supabase.from("assignment_submissions")
        .select("id, context_pack_id, answers, status, score, ai_feedback, teacher_feedback, graded_by, submitted_at, context_packs(title, type)")
        .eq("class_id", classId).eq("student_id", studentId).order("submitted_at", { ascending: false }),
    ]);

    return NextResponse.json({
      student: {
        id: studentId,
        name: profile?.display_name || "Student",
        grade_level: profile?.grade_level ?? null,
        tier: profile?.tier ?? "free",
        role: profile?.role ?? null,
        private: isPrivate,
      },
      chats: chats ?? [],
      apps: apps ?? [],
      submissions: (submissions ?? []).map((s) => {
        const pack = Array.isArray(s.context_packs) ? s.context_packs[0] : s.context_packs;
        return { ...s, context_packs: undefined, title: (pack as { title?: string } | null)?.title ?? "Assignment" };
      }),
    });
  } catch (error) {
    console.error("Student detail API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
