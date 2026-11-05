import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/api-auth";
import { getAdminClient } from "@/lib/usage";
import { SKILLS, SKILL_CODES, sectionOf } from "@/lib/quest/skills";

// Question bank overview: every skill with how many questions are approved or waiting for review,
// and whether it has a lesson
export async function GET(req: NextRequest) {
  const auth = await requireTeacher(req);
  if (auth.error) return auth.error;

  const [{ data, error }, { data: lessons }] = await Promise.all([
    getAdminClient().from("quest_items").select("skill_id, status, report_count"),
    getAdminClient().from("quest_lessons").select("skill_id, status"),
  ]);
  const lessonStatus = new Map((lessons ?? []).map((l) => [l.skill_id, l.status as string]));
  if (error) {
    console.error("Question bank query failed:", error);
    return NextResponse.json({ error: "Failed to load the question bank" }, { status: 500 });
  }

  const counts = new Map<string, { approved: number; draft: number; reported: number }>();
  for (const row of data ?? []) {
    const c = counts.get(row.skill_id) ?? { approved: 0, draft: 0, reported: 0 };
    if (row.status === "approved") c.approved++;
    else if (row.status === "draft") c.draft++;
    if (row.status !== "rejected" && row.report_count > 0) c.reported++;
    counts.set(row.skill_id, c);
  }

  return NextResponse.json({
    skills: SKILLS.map((s) => ({
      id: s.id, code: SKILL_CODES[s.id], name: s.name, grade: s.grade, section: sectionOf(s), strand: s.strand, standard: s.standard, nad: s.nad, advanced: !!s.advanced,
      approved: counts.get(s.id)?.approved ?? 0,
      draft: counts.get(s.id)?.draft ?? 0,
      reported: counts.get(s.id)?.reported ?? 0,
      lesson: lessonStatus.get(s.id) ?? null,
    })),
  });
}
