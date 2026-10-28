import { NextRequest, NextResponse } from "next/server";
import { answerAssessment, startAssessment } from "@/lib/quest/engine";
import { respond, unauthorized, userIdFrom } from "@/lib/quest/api";
import { getAdminClient } from "@/lib/usage";

// Start/resume:  { action: "start", kind: "diagnostic" | "post" }
// Answer:        { action: "answer", assessment_id, item_id, response, seconds }
export async function POST(req: NextRequest) {
  const userId = await userIdFrom(req);
  if (!userId) return unauthorized();
  const body = await req.json().catch(() => ({}));

  if (body.action === "start") {
    if (body.kind !== "diagnostic" && body.kind !== "post") {
      return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
    }
    if (body.kind === "post" && !(await postCheckOpen(userId))) {
      return NextResponse.json({ error: "Your teacher hasn't opened the check yet." }, { status: 403 });
    }
    return respond(await startAssessment(userId, body.kind));
  }

  if (body.action === "answer") {
    if (typeof body.assessment_id !== "string" || typeof body.item_id !== "string" || typeof body.response !== "string") {
      return NextResponse.json({ error: "Missing answer" }, { status: 400 });
    }
    return respond(await answerAssessment(userId, body.assessment_id, body.item_id, body.response, body.seconds));
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

async function postCheckOpen(studentId: string): Promise<boolean> {
  const supabase = getAdminClient();
  const { data: enrollment } = await supabase.from("enrollments").select("class_id").eq("student_id", studentId).limit(1).maybeSingle();
  if (!enrollment) return false;
  const { data } = await supabase.from("quest_class_focus").select("post_check_open").eq("class_id", enrollment.class_id).maybeSingle();
  return !!data?.post_check_open;
}
