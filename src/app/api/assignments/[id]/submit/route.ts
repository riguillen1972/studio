import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, checkUsage, recordUsage } from "@/lib/usage";
import { hasTeacherMax } from "@/lib/billing";
import { gradeSubmission } from "@/lib/grading";

export const maxDuration = 60;
const MAX_ANSWER_CHARS = 10000;

// A student hands in their answers (once). If their teacher has Teacher Max, the AI grades it right away.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 });
    }
    const supabase = getAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.split(" ")[1]);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;

    const { answers } = await req.json().catch(() => ({}));
    const text = typeof answers === "string" ? answers.trim() : "";
    if (!text) {
      return NextResponse.json({ error: "Write your answers before submitting" }, { status: 400 });
    }
    if (text.length > MAX_ANSWER_CHARS) {
      return NextResponse.json({ error: `Keep your answers under ${MAX_ANSWER_CHARS.toLocaleString()} characters` }, { status: 400 });
    }

    const { data: pack } = await supabase
      .from("context_packs")
      .select("id, class_id, teacher_id, type, title, content_parsed, answer_key, rubric, status")
      .eq("id", id)
      .maybeSingle();
    if (!pack || pack.status !== "active" || !["homework", "quiz"].includes(pack.type)) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("class_id", pack.class_id)
      .eq("student_id", user.id)
      .maybeSingle();
    if (!enrollment) {
      return NextResponse.json({ error: "You're not in this class" }, { status: 403 });
    }

    const { data: submission, error: insertError } = await supabase
      .from("assignment_submissions")
      .insert({ context_pack_id: pack.id, class_id: pack.class_id, student_id: user.id, answers: text })
      .select("*")
      .single();
    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json({ error: "You already turned this in" }, { status: 409 });
      }
      console.error("Submission insert failed:", insertError);
      return NextResponse.json({ error: "Couldn't submit. Please try again." }, { status: 500 });
    }

    // Auto-grading is a Teacher Max feature and uses the teacher's Claude allowance
    const canAutoGrade = (await hasTeacherMax(pack.teacher_id)) && !(await checkUsage(pack.teacher_id, "haiku"));
    if (!canAutoGrade) {
      return NextResponse.json({ submission });
    }

    try {
      const { grade, totalTokens } = await gradeSubmission({
        title: pack.title,
        assignment: pack.content_parsed ?? "",
        answerKey: pack.answer_key,
        rubric: pack.rubric,
        answers: text,
      });
      await recordUsage(pack.teacher_id, "haiku", totalTokens).catch((e) => console.error("Failed to record usage:", e));

      const { data: graded } = await supabase
        .from("assignment_submissions")
        .update({ status: "graded", score: grade.score, ai_feedback: grade, graded_by: "ai", graded_at: new Date().toISOString() })
        .eq("id", submission.id)
        .select("*")
        .single();
      return NextResponse.json({ submission: graded ?? submission });
    } catch (e) {
      // Still submitted; the teacher can grade it by hand
      console.error("Auto-grading failed:", e);
      return NextResponse.json({ submission });
    }
  } catch (error) {
    console.error("Submit API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
