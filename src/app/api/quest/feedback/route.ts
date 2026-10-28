import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/usage";
import { unauthorized, userIdFrom } from "@/lib/quest/api";

// Pilot feedback.
// Students:  { kind: "student_survey", rating: 1–5 (helpful), answer: "1"–"5" (enjoyable), comment }
// Teachers:  { kind: "teacher_agreement", class_id, student_id, answer: "yes" | "partly" | "no", comment }
//            { kind: "teacher_survey", class_id, rating: 1–5, comment }
export async function POST(req: NextRequest) {
  const userId = await userIdFrom(req);
  if (!userId) return unauthorized();
  const supabase = getAdminClient();
  const body = await req.json().catch(() => ({}));
  const comment = typeof body.comment === "string" ? body.comment.slice(0, 1000) : null;
  const rating = Number.isInteger(body.rating) && body.rating >= 1 && body.rating <= 5 ? body.rating : null;

  if (body.kind === "student_survey") {
    const { data: enrollment } = await supabase.from("enrollments").select("class_id").eq("student_id", userId).limit(1).maybeSingle();
    await supabase.from("quest_feedback").insert({
      kind: "student_survey", author_id: userId, student_id: userId, class_id: enrollment?.class_id ?? null,
      rating, answer: typeof body.answer === "string" ? body.answer.slice(0, 20) : null, comment,
    });
    return NextResponse.json({ success: true });
  }

  if (body.kind === "teacher_agreement" || body.kind === "teacher_survey") {
    const { data: cls } = await supabase.from("classes").select("teacher_id").eq("id", body.class_id).maybeSingle();
    if (!cls || cls.teacher_id !== userId) return NextResponse.json({ error: "Class not found" }, { status: 404 });
    if (body.kind === "teacher_agreement") {
      if (!["yes", "partly", "no"].includes(body.answer)) return NextResponse.json({ error: "Invalid answer" }, { status: 400 });
      // One answer per student: replace any earlier one
      await supabase.from("quest_feedback").delete()
        .eq("kind", "teacher_agreement").eq("class_id", body.class_id).eq("student_id", body.student_id).eq("author_id", userId);
    }
    await supabase.from("quest_feedback").insert({
      kind: body.kind, author_id: userId, class_id: body.class_id,
      student_id: body.kind === "teacher_agreement" ? body.student_id : null,
      rating, answer: typeof body.answer === "string" ? body.answer : null, comment,
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown feedback" }, { status: 400 });
}
