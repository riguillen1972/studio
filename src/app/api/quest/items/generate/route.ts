import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/api-auth";
import { checkUsage, getAdminClient, recordUsage } from "@/lib/usage";
import { getSkill } from "@/lib/quest/skills";
import { generateItems } from "@/lib/quest/generate";

export const maxDuration = 60;

// A teacher asks the AI to draft questions for a skill. They're saved as drafts to review.
export async function POST(req: NextRequest) {
  try {
    const auth = await requireTeacher(req);
    if (auth.error) return auth.error;

    const { skill_id, count } = await req.json().catch(() => ({}));
    const skill = getSkill(skill_id);
    if (!skill) {
      return NextResponse.json({ error: "Unknown skill" }, { status: 400 });
    }
    const n = Math.min(10, Math.max(1, Number(count) || 8));

    // Uses the teacher's monthly Claude allowance
    const usageError = await checkUsage(auth.user.id, "haiku");
    if (usageError) {
      return NextResponse.json({ error: usageError }, { status: 402 });
    }

    const { items, totalTokens, dropped } = await generateItems(skill, n);
    await recordUsage(auth.user.id, "haiku", totalTokens).catch((e) => console.error("Failed to record usage:", e));

    if (items.length === 0) {
      return NextResponse.json({ error: "None of the drafted questions passed the accuracy check. Try again." }, { status: 502 });
    }

    const { data, error } = await getAdminClient()
      .from("quest_items")
      .insert(items.map((i) => ({ ...i, status: "draft", created_by: auth.user.id })))
      .select("*");
    if (error) {
      console.error("Saving drafted questions failed:", error);
      return NextResponse.json({ error: "Failed to save the questions" }, { status: 500 });
    }

    return NextResponse.json({ items: data, dropped });
  } catch (error) {
    console.error("Question generation error:", error);
    return NextResponse.json({ error: "Couldn't draft questions right now. Please try again." }, { status: 500 });
  }
}
