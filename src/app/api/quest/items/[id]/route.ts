import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/api-auth";
import { getAdminClient } from "@/lib/usage";
import { checkAnswer, type QuestChoice } from "@/lib/quest/answers";
import { MISCONCEPTIONS_BY_ID } from "@/lib/quest/misconceptions";

// A teacher approves, rejects, or edits a question
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireTeacher(req);
    if (auth.error) return auth.error;
    const { id } = await params;
    const supabase = getAdminClient();

    const body = await req.json().catch(() => ({}));
    const { data: item } = await supabase.from("quest_items").select("*").eq("id", id).maybeSingle();
    if (!item) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    for (const field of ["stem", "answer", "explanation"] as const) {
      if (body[field] !== undefined) {
        if (typeof body[field] !== "string" || !body[field].trim() || body[field].length > 2000) {
          return NextResponse.json({ error: `${field} can't be empty` }, { status: 400 });
        }
        updates[field] = body[field].trim();
      }
    }
    if (body.choices !== undefined) {
      if (item.kind !== "multiple_choice" || !Array.isArray(body.choices) || body.choices.length !== 4) {
        return NextResponse.json({ error: "Multiple choice questions need exactly 4 choices" }, { status: 400 });
      }
      const choices: QuestChoice[] = body.choices.map((c: QuestChoice) => ({
        text: String(c.text ?? "").trim(),
        ...(c.correct ? { correct: true } : {}),
        ...(!c.correct && c.misconception && MISCONCEPTIONS_BY_ID[c.misconception] ? { misconception: c.misconception } : {}),
      }));
      if (choices.some((c) => !c.text) || choices.filter((c) => c.correct).length !== 1) {
        return NextResponse.json({ error: "Each choice needs text, and exactly one must be correct" }, { status: 400 });
      }
      updates.choices = choices;
    }

    // Keep the answer consistent with the correct choice
    const merged = { ...item, ...updates };
    if (merged.kind === "multiple_choice") {
      const correct = (merged.choices as QuestChoice[]).find((c) => c.correct);
      if (!correct || !checkAnswer(merged, merged.answer).correct) {
        updates.answer = correct?.text ?? merged.answer;
      }
    }

    if (body.status !== undefined) {
      if (!["draft", "approved", "rejected"].includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updates.status = body.status;
      updates.reviewed_by = auth.user.id;
      updates.reviewed_at = new Date().toISOString();
    }

    const { data, error } = await supabase.from("quest_items").update(updates).eq("id", id).select("*").single();
    if (error) {
      console.error("Question update failed:", error);
      return NextResponse.json({ error: "Failed to save the question" }, { status: 500 });
    }
    return NextResponse.json({ item: data });
  } catch (error) {
    console.error("Question PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
