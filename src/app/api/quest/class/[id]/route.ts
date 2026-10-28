import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/api-auth";
import { getAdminClient } from "@/lib/usage";
import { SKILLS, SKILLS_BY_ID } from "@/lib/quest/skills";
import { MISCONCEPTIONS_BY_ID } from "@/lib/quest/misconceptions";
import { GAP_BELOW, statusOf } from "@/lib/quest/mastery";

async function ownClass(req: NextRequest, classId: string) {
  const auth = await requireTeacher(req);
  if (auth.error) return { error: auth.error };
  const { data: cls } = await getAdminClient().from("classes").select("id, name, teacher_id").eq("id", classId).maybeSingle();
  if (!cls || cls.teacher_id !== auth.user.id) return { error: NextResponse.json({ error: "Class not found" }, { status: 404 }) };
  return { cls, teacherId: auth.user.id };
}

// Everything the teacher needs for Math Quest: heat map, small groups, focus, and the week's report
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: classId } = await params;
    const owned = await ownClass(req, classId);
    if (owned.error) return owned.error;
    const supabase = getAdminClient();

    const { data: enrollments } = await supabase.from("enrollments").select("student_id").eq("class_id", classId);
    const ids = (enrollments ?? []).map((e) => e.student_id);
    const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const none = { data: [] as never[] };

    const [{ data: profiles }, { data: mastery }, { data: assessments }, { data: attempts }, { data: focus }, { data: feedback }] = await Promise.all([
      ids.length ? supabase.from("profiles").select("id, display_name, role, grade_level").in("id", ids) : Promise.resolve(none),
      ids.length ? supabase.from("quest_mastery").select("student_id, skill_id, p_known, attempts, mastered_at").in("student_id", ids) : Promise.resolve(none),
      ids.length ? supabase.from("quest_assessments").select("student_id, kind, status, results, started_at, completed_at").in("student_id", ids).order("started_at", { ascending: false }) : Promise.resolve(none),
      ids.length ? supabase.from("quest_attempts").select("student_id, skill_id, phase, correct, misconception, seconds, created_at").in("student_id", ids).gte("created_at", weekAgo) : Promise.resolve(none),
      supabase.from("quest_class_focus").select("skill_ids, post_check_open").eq("class_id", classId).maybeSingle(),
      supabase.from("quest_feedback").select("kind, student_id, rating, answer, comment, created_at").eq("class_id", classId),
    ]);

    // Grades 6–8 students only
    const students = (profiles ?? [])
      .filter((p) => p.role === "k12" && Number(p.grade_level) >= 6 && Number(p.grade_level) <= 8)
      .map((p) => ({ id: p.id, name: p.display_name || "Student", grade: Number(p.grade_level) }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const masteryOf = (sid: string) => (mastery ?? []).filter((m) => m.student_id === sid);
    const latest = (sid: string, kind: string) => (assessments ?? []).find((a) => a.student_id === sid && a.kind === kind) ?? null;
    const attemptsOf = (sid: string) => (attempts ?? []).filter((a) => a.student_id === sid);

    // Heat map: skills that anyone has data on, plus focus skills, in skill-map order
    const focusIds: string[] = focus?.skill_ids ?? [];
    const used = new Set([...(mastery ?? []).map((m) => m.skill_id), ...focusIds]);
    const skills = SKILLS.filter((s) => used.has(s.id)).map((s) => ({ id: s.id, name: s.name, grade: s.grade }));
    const heat: Record<string, Record<string, { p: number; status: string }>> = {};
    for (const m of mastery ?? []) {
      (heat[m.student_id] ??= {})[m.skill_id] = { p: m.p_known, status: m.mastered_at ? "mastered" : statusOf(m.p_known, m.attempts) };
    }

    // Small groups: students who share a weak skill, or keep making the same mistake
    const groups: { reason: string; skill_id?: string; misconception?: string; students: string[] }[] = [];
    const weakBySkill = new Map<string, string[]>();
    for (const st of students) {
      const top = masteryOf(st.id).filter((m) => !m.mastered_at && m.p_known < GAP_BELOW).sort((a, b) => a.p_known - b.p_known)[0];
      if (top) weakBySkill.set(top.skill_id, [...(weakBySkill.get(top.skill_id) ?? []), st.id]);
    }
    for (const [skillId, sids] of weakBySkill) {
      if (sids.length >= 2) groups.push({ reason: `Struggling most with ${SKILLS_BY_ID[skillId]?.name}`, skill_id: skillId, students: sids });
    }
    const misconceptionStudents = new Map<string, Set<string>>();
    for (const a of attempts ?? []) {
      if (!a.misconception || a.misconception === "computation-slip") continue;
      const count = (attempts ?? []).filter((x) => x.student_id === a.student_id && x.misconception === a.misconception).length;
      if (count >= 2) (misconceptionStudents.get(a.misconception) ?? misconceptionStudents.set(a.misconception, new Set()).get(a.misconception)!).add(a.student_id);
    }
    for (const [mid, set] of misconceptionStudents) {
      if (set.size >= 2) groups.push({ reason: `Same mistake: ${MISCONCEPTIONS_BY_ID[mid]?.name}`, misconception: mid, students: [...set] });
    }
    groups.sort((a, b) => b.students.length - a.students.length);

    // Report per student
    const agreement = new Map((feedback ?? []).filter((f) => f.kind === "teacher_agreement").map((f) => [f.student_id, f.answer]));
    const report = students.map((st) => {
      const diag = latest(st.id, "diagnostic");
      const post = latest(st.id, "post");
      const practice = attemptsOf(st.id).filter((a) => a.phase === "practice" || a.phase === "review");
      const postResults = post?.status === "completed" ? post.results as { pre_average: number | null; post_average_same_skills: number | null; post_average: number | null } : null;
      return {
        student_id: st.id,
        name: st.name,
        grade: st.grade,
        diagnostic_done: diag?.status === "completed",
        diagnostic_gaps: diag?.status === "completed" ? ((diag.results as { gaps?: string[] }).gaps ?? []).map((g) => SKILLS_BY_ID[g]?.name ?? g) : [],
        practice_questions: practice.length,
        practice_correct: practice.filter((a) => a.correct).length,
        minutes: Math.round(practice.reduce((s, a) => s + (a.seconds ?? 0), 0) / 60),
        mastered_this_week: masteryOf(st.id).filter((m) => m.mastered_at && m.mastered_at >= weekAgo).length,
        post_done: post?.status === "completed",
        pre_average: postResults?.pre_average ?? null,
        post_average: postResults?.post_average_same_skills ?? null,
        teacher_agrees: agreement.get(st.id) ?? null,
      };
    });

    const surveys = (feedback ?? []).filter((f) => f.kind === "student_survey");
    const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
    const withBoth = report.filter((r) => r.pre_average !== null && r.post_average !== null);

    return NextResponse.json({
      class: { id: owned.cls.id, name: owned.cls.name },
      focus_skill_ids: focusIds,
      post_check_open: !!focus?.post_check_open,
      all_skills: SKILLS.map((s) => ({ id: s.id, name: s.name, grade: s.grade })),
      students,
      skills,
      heat,
      groups,
      report,
      summary: {
        students: students.length,
        diagnostic_done: report.filter((r) => r.diagnostic_done).length,
        post_done: report.filter((r) => r.post_done).length,
        practice_questions: report.reduce((s, r) => s + r.practice_questions, 0),
        minutes: report.reduce((s, r) => s + r.minutes, 0),
        mastered: report.reduce((s, r) => s + r.mastered_this_week, 0),
        pre_average: avg(withBoth.map((r) => r.pre_average as number)),
        post_average: avg(withBoth.map((r) => r.post_average as number)),
        teacher_agreement: {
          yes: report.filter((r) => r.teacher_agrees === "yes").length,
          partly: report.filter((r) => r.teacher_agrees === "partly").length,
          no: report.filter((r) => r.teacher_agrees === "no").length,
        },
        student_survey: {
          responses: surveys.length,
          helpful: avg(surveys.map((s) => s.rating).filter((n): n is number => typeof n === "number")),
          enjoyed: avg(surveys.map((s) => Number(s.answer)).filter((n) => n >= 1 && n <= 5)),
          comments: surveys.map((s) => s.comment).filter(Boolean),
        },
        teacher_survey: (feedback ?? []).filter((f) => f.kind === "teacher_survey").map((f) => ({ rating: f.rating, comment: f.comment })),
      },
    });
  } catch (error) {
    console.error("Quest class API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Set the week's focus skills and/or open the end-of-week check: { skill_ids?: string[], post_check_open?: boolean }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = await params;
  const owned = await ownClass(req, classId);
  if (owned.error) return owned.error;
  const body = await req.json().catch(() => ({}));

  const { data: existing } = await getAdminClient().from("quest_class_focus").select("skill_ids, post_check_open").eq("class_id", classId).maybeSingle();
  const row = {
    class_id: classId,
    skill_ids: Array.isArray(body.skill_ids) ? body.skill_ids.filter((s: string) => SKILLS_BY_ID[s]).slice(0, 12) : existing?.skill_ids ?? [],
    post_check_open: typeof body.post_check_open === "boolean" ? body.post_check_open : existing?.post_check_open ?? false,
    updated_at: new Date().toISOString(),
  };
  const { error } = await getAdminClient().from("quest_class_focus").upsert(row, { onConflict: "class_id" });
  if (error) {
    console.error("Quest focus update failed:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
  return NextResponse.json({ success: true, ...row });
}
