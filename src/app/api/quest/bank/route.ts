import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/api-auth";
import { getAdminClient } from "@/lib/usage";
import { SKILLS } from "@/lib/quest/skills";

// Question bank overview: every skill with how many questions are approved or waiting for review
export async function GET(req: NextRequest) {
  const auth = await requireTeacher(req);
  if (auth.error) return auth.error;

  const { data, error } = await getAdminClient().from("quest_items").select("skill_id, status");
  if (error) {
    console.error("Question bank query failed:", error);
    return NextResponse.json({ error: "Failed to load the question bank" }, { status: 500 });
  }

  const counts = new Map<string, { approved: number; draft: number }>();
  for (const row of data ?? []) {
    const c = counts.get(row.skill_id) ?? { approved: 0, draft: 0 };
    if (row.status === "approved") c.approved++;
    else if (row.status === "draft") c.draft++;
    counts.set(row.skill_id, c);
  }

  return NextResponse.json({
    skills: SKILLS.map((s) => ({
      id: s.id, name: s.name, grade: s.grade, strand: s.strand, standard: s.standard,
      approved: counts.get(s.id)?.approved ?? 0,
      draft: counts.get(s.id)?.draft ?? 0,
    })),
  });
}
