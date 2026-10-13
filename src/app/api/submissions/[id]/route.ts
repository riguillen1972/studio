import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/api-auth";
import { getAdminClient } from "@/lib/usage";

// The teacher sets or changes a grade and leaves feedback
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireTeacher(req);
    if (auth.error) return auth.error;
    const { id } = await params;
    const supabase = getAdminClient();

    const { score, teacher_feedback } = await req.json().catch(() => ({}));
    const value = Number(score);
    if (!Number.isInteger(value) || value < 0 || value > 100) {
      return NextResponse.json({ error: "Score must be a whole number from 0 to 100" }, { status: 400 });
    }
    if (teacher_feedback !== undefined && teacher_feedback !== null && (typeof teacher_feedback !== "string" || teacher_feedback.length > 2000)) {
      return NextResponse.json({ error: "Feedback must be text up to 2,000 characters" }, { status: 400 });
    }

    const { data: submission } = await supabase
      .from("assignment_submissions")
      .select("id, classes(teacher_id)")
      .eq("id", id)
      .maybeSingle();
    const cls = submission && (Array.isArray(submission.classes) ? submission.classes[0] : submission.classes);
    if (!submission || (cls as { teacher_id?: string } | null)?.teacher_id !== auth.user.id) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("assignment_submissions")
      .update({
        score: value,
        teacher_feedback: teacher_feedback?.trim() || null,
        status: "graded",
        graded_by: "teacher",
        graded_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) {
      console.error("Grade update failed:", error);
      return NextResponse.json({ error: "Failed to save the grade" }, { status: 500 });
    }
    return NextResponse.json({ submission: data });
  } catch (error) {
    console.error("Submission PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
