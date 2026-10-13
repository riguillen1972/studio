import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/usage";

// Fields students may see. Never answer_key, and not content_raw (the teacher's unprocessed paste).
const STUDENT_FIELDS = "id, class_id, type, title, subject, content_parsed, due_date, created_at";

// A student's active homework and quizzes across all their classes. ?id=... returns one.
export async function GET(req: NextRequest) {
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

    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("class_id, classes(name)")
      .eq("student_id", user.id);

    const classNames = new Map<string, string>();
    for (const e of enrollments ?? []) {
      const cls = Array.isArray(e.classes) ? e.classes[0] : e.classes;
      classNames.set(e.class_id, (cls as { name?: string } | null)?.name ?? "Class");
    }
    if (classNames.size === 0) {
      return NextResponse.json({ data: [] });
    }

    let query = supabase
      .from("context_packs")
      .select(STUDENT_FIELDS)
      .in("class_id", [...classNames.keys()])
      .in("type", ["homework", "quiz"])
      .eq("status", "active");

    const id = req.nextUrl.searchParams.get("id");
    if (id) query = query.eq("id", id);

    const { data: packs, error } = await query;
    if (error) {
      console.error("Assignments query failed:", error);
      return NextResponse.json({ error: "Failed to load assignments" }, { status: 500 });
    }

    // The student's own submissions and grades (not the answers they wrote, to keep the payload small)
    const packIds = (packs ?? []).map((p) => p.id);
    const { data: submissions } = packIds.length
      ? await supabase
          .from("assignment_submissions")
          .select("context_pack_id, status, score, ai_feedback, teacher_feedback, submitted_at")
          .eq("student_id", user.id)
          .in("context_pack_id", packIds)
      : { data: [] };
    const submissionByPack = new Map((submissions ?? []).map((s) => [s.context_pack_id, s]));

    // Soonest due first; undated assignments after, newest first
    const sorted = (packs ?? [])
      .map((p) => ({ ...p, class_name: classNames.get(p.class_id) ?? "Class", submission: submissionByPack.get(p.id) ?? null }))
      .sort((a, b) => {
        if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
        if (a.due_date) return -1;
        if (b.due_date) return 1;
        return b.created_at.localeCompare(a.created_at);
      });

    return NextResponse.json({ data: sorted });
  } catch (error) {
    console.error("Assignments API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
