import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/api-auth";
import { getAdminClient } from "@/lib/usage";
import { SKILLS_BY_ID, SKILL_CODES, sectionOf } from "@/lib/quest/skills";
import type { QuestChoice } from "@/lib/quest/answers";

const MAX_SKILLS = 40;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Questions for a printable worksheet: ?skills=id1,id2&per=6. Picks live questions at random
// (a new version on every call), easiest first within each skill, with choices shuffled and the
// correct letter kept for the answer key.
export async function GET(req: NextRequest) {
  const auth = await requireTeacher(req);
  if (auth.error) return auth.error;

  const ids = (req.nextUrl.searchParams.get("skills") ?? "").split(",").filter((id) => SKILLS_BY_ID[id]).slice(0, MAX_SKILLS);
  if (ids.length === 0) return NextResponse.json({ error: "Pick at least one skill" }, { status: 400 });
  const per = Math.min(15, Math.max(1, Number(req.nextUrl.searchParams.get("per")) || 6));

  const { data, error } = await getAdminClient().from("quest_items")
    .select("id, skill_id, difficulty, kind, stem, choices, answer, explanation")
    .in("skill_id", ids).eq("status", "approved");
  if (error) {
    console.error("Worksheet query failed:", error);
    return NextResponse.json({ error: "Failed to load questions" }, { status: 500 });
  }

  const skills = ids.map((id) => {
    const s = SKILLS_BY_ID[id];
    const questions = shuffle((data ?? []).filter((q) => q.skill_id === id)).slice(0, per)
      .sort((a, b) => a.difficulty - b.difficulty)
      .map((q) => {
        const choices = q.choices ? shuffle(q.choices as QuestChoice[]) : null;
        return {
          id: q.id, kind: q.kind, stem: q.stem, explanation: q.explanation,
          choices: choices?.map((c) => c.text) ?? null,
          answer: choices ? choices.find((c) => c.correct)?.text ?? q.answer : q.answer,
          correct_index: choices ? choices.findIndex((c) => c.correct) : null,
        };
      });
    return { id, code: SKILL_CODES[id], name: s.name, section: sectionOf(s), nad: s.nad, questions };
  });
  return NextResponse.json({ skills });
}
