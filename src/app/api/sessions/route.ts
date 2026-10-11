import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/api-auth";
import { getAdminClient } from "@/lib/usage";
import {
  MONTHLY_INCLUDED_SESSIONS,
  addUsage,
  billingPeriod,
  buildSystemPrompt,
  emptyCost,
  initialHistory,
  runTeacherTurn,
  toDisplay,
  type AvatarConfig,
  type LessonPack,
} from "@/lib/live-session";

export const maxDuration = 60;

async function getMonthlyUsage(teacherId: string) {
  const { data } = await getAdminClient()
    .from("monthly_session_counts")
    .select("session_count, overage_sessions")
    .eq("teacher_id", teacherId)
    .eq("billing_period", billingPeriod())
    .maybeSingle();
  const used = data?.session_count ?? 0;
  const extra = data?.overage_sessions ?? 0;
  const allowed = MONTHLY_INCLUDED_SESSIONS + extra;
  return { used, included: MONTHLY_INCLUDED_SESSIONS, extra, remaining: Math.max(0, allowed - used) };
}

// This month's session usage and recent sessions
export async function GET(req: NextRequest) {
  const auth = await requireTeacher(req);
  if (auth.error) return auth.error;

  const [usage, { data: sessions }] = await Promise.all([
    getMonthlyUsage(auth.user.id),
    getAdminClient()
      .from("session_records")
      .select("id, status, started_at, ended_at, classes(name), context_packs(title)")
      .eq("teacher_id", auth.user.id)
      .order("started_at", { ascending: false })
      .limit(10),
  ]);

  return NextResponse.json({ usage, sessions: sessions ?? [] });
}

// Start a live session: counts toward the monthly allowance and returns the avatar's opening turn
export async function POST(req: NextRequest) {
  try {
    const auth = await requireTeacher(req, { requireMax: true });
    if (auth.error) return auth.error;
    const teacherId = auth.user.id;
    const supabase = getAdminClient();

    const { class_id, context_pack_id } = await req.json().catch(() => ({}));
    if (!class_id) {
      return NextResponse.json({ error: "Choose a class" }, { status: 400 });
    }

    const { data: cls } = await supabase
      .from("classes")
      .select("id, name, subject, teacher_id")
      .eq("id", class_id)
      .maybeSingle();
    if (!cls || cls.teacher_id !== teacherId) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    let pack: LessonPack | null = null;
    if (context_pack_id) {
      const { data } = await supabase
        .from("context_packs")
        .select("title, type, subject, content_parsed, content_raw, rubric, answer_key, class_id, teacher_id")
        .eq("id", context_pack_id)
        .maybeSingle();
      if (!data || data.teacher_id !== teacherId || data.class_id !== class_id) {
        return NextResponse.json({ error: "Lesson material not found for this class" }, { status: 404 });
      }
      pack = data;
    }

    const { data: avatar } = await supabase
      .from("avatar_configs")
      .select("id, name, title, backstory, greeting_phrase, sign_off_phrase, warmth, energy, strictness, humor, teaching_method, adaptation_style, never_do, special_instructions")
      .eq("teacher_id", teacherId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!avatar) {
      return NextResponse.json({ error: "Save your AI Teacher in the builder first" }, { status: 400 });
    }

    const usage = await getMonthlyUsage(teacherId);
    if (usage.remaining <= 0) {
      return NextResponse.json({ error: "You've used all your live sessions this month", code: "session_limit", usage }, { status: 402 });
    }

    // Class info for the prompt: counts and grade levels only, no student names
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("student_id")
      .eq("class_id", class_id);
    const studentIds = (enrollments ?? []).map((e) => e.student_id);
    const { data: students } = studentIds.length
      ? await supabase.from("profiles").select("grade_level").in("id", studentIds)
      : { data: [] as { grade_level: string | null }[] };
    const gradeLevels = [...new Set((students ?? []).map((s) => s.grade_level).filter((g): g is string => !!g))]
      .sort((a, b) => Number(a) - Number(b));

    const system = buildSystemPrompt(avatar as AvatarConfig, {
      name: cls.name,
      subject: cls.subject,
      studentCount: enrollments?.length ?? 0,
      gradeLevels,
    }, pack);
    const history = initialHistory(system);

    const turn = await runTeacherTurn(history);
    if (turn.refused || !turn.text) {
      return NextResponse.json({ error: "The AI Teacher couldn't start this lesson. Try different lesson material." }, { status: 502 });
    }
    history.messages.push({ role: "assistant", content: turn.content });

    // Count the session only once it has actually started
    const period = billingPeriod();
    const { data: counts } = await supabase
      .from("monthly_session_counts")
      .select("session_count")
      .eq("teacher_id", teacherId)
      .eq("billing_period", period)
      .maybeSingle();
    await supabase.from("monthly_session_counts").upsert(
      { teacher_id: teacherId, billing_period: period, session_count: (counts?.session_count ?? 0) + 1 },
      { onConflict: "teacher_id,billing_period" }
    );

    const { data: record, error } = await supabase
      .from("session_records")
      .insert({
        teacher_id: teacherId,
        class_id,
        avatar_config_id: avatar.id,
        context_pack_id: context_pack_id || null,
        session_history: history,
        cost_breakdown: addUsage(emptyCost(), turn.usage),
        status: "active",
      })
      .select("id, status, started_at")
      .single();

    if (error) {
      console.error("Failed to save session:", error);
      return NextResponse.json({ error: "Failed to start the session" }, { status: 500 });
    }

    return NextResponse.json({
      session: { ...record, avatar_name: avatar.name, class_name: cls.name },
      messages: toDisplay(history),
      usage: { ...usage, used: usage.used + 1, remaining: usage.remaining - 1 },
    });
  } catch (error) {
    console.error("Session start error:", error);
    return NextResponse.json({ error: "Failed to start the session" }, { status: 500 });
  }
}
