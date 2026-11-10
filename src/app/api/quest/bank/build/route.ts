import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/api-auth";
import { getAdminClient } from "@/lib/usage";
import { getSkill } from "@/lib/quest/skills";
import { generateItems } from "@/lib/quest/generate";

export const maxDuration = 300;

/** Live questions a skill should have before the starter build stops adding more. */
const STARTER_TARGET = 15;

// Builds the shared starter bank one skill at a time: drafts questions, keeps only those that pass
// both independent checks, and makes them live right away. Teachers can hide any of them later.
// It stops once a skill has STARTER_TARGET live questions, so the total cost is bounded and it
// isn't charged to the teacher's monthly allowance.
export async function POST(req: NextRequest) {
  try {
    const auth = await requireTeacher(req);
    if (auth.error) return auth.error;

    const { skill_id } = await req.json().catch(() => ({}));
    const skill = getSkill(skill_id);
    if (!skill) return NextResponse.json({ error: "Unknown skill" }, { status: 400 });

    const supabase = getAdminClient();
    const liveCount = async () => (await supabase.from("quest_items")
      .select("id", { count: "exact", head: true }).eq("skill_id", skill.id).eq("status", "approved")).count ?? 0;

    const before = await liveCount();
    if (before >= STARTER_TARGET) return NextResponse.json({ skill_id: skill.id, live: before, added: 0, dropped: 0, done: true });

    // Ask for a few extra, since some won't pass the checks, and show it what's there so it doesn't repeat
    const { data: existing } = await supabase.from("quest_items").select("stem").eq("skill_id", skill.id).neq("status", "rejected");
    const { items, totalTokens, dropped } = await generateItems(skill, Math.min(12, STARTER_TARGET - before + 4), {
      strict: true, avoid: (existing ?? []).map((e) => e.stem),
    });
    console.log(`Starter bank ${skill.id}: +${items.length}, dropped ${dropped}, ${totalTokens} tokens`);

    if (items.length > 0) {
      const { error } = await supabase.from("quest_items").insert(items.map((i) => ({
        ...i, status: "approved", source: "starter", created_by: auth.user.id,
      })));
      if (error) {
        console.error("Saving starter questions failed:", error);
        return NextResponse.json({ error: "Failed to save the questions" }, { status: 500 });
      }
    }
    const live = await liveCount();
    return NextResponse.json({ skill_id: skill.id, live, added: items.length, dropped, done: live >= STARTER_TARGET });
  } catch (error) {
    console.error("Starter bank build error:", error);
    return NextResponse.json({ error: "Couldn't build questions for this skill right now." }, { status: 500 });
  }
}
