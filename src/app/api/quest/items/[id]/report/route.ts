import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/usage";
import { unauthorized, userIdFrom } from "@/lib/quest/api";

/** Reports from this many different students take a live question back into teacher review. */
const PULL_AFTER_REPORTS = 2;

// A student reports a problem with a question: { reason: wrong_answer | confusing | typo | other, comment? }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await userIdFrom(req);
  if (!userId) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (!["wrong_answer", "confusing", "typo", "other"].includes(body.reason)) {
    return NextResponse.json({ error: "Pick what's wrong with the question" }, { status: 400 });
  }
  const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 500) || null : null;

  const supabase = getAdminClient();
  const { data: item } = await supabase.from("quest_items").select("id, status").eq("id", id).maybeSingle();
  if (!item) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  const { error } = await supabase.from("quest_item_reports")
    .upsert({ item_id: id, student_id: userId, reason: body.reason, comment }, { onConflict: "item_id,student_id" });
  if (error) {
    console.error("Saving question report failed:", error);
    return NextResponse.json({ error: "Couldn't send the report" }, { status: 500 });
  }

  const { count } = await supabase.from("quest_item_reports").select("id", { count: "exact", head: true }).eq("item_id", id);
  const reports = count ?? 0;
  const pulled = item.status === "approved" && reports >= PULL_AFTER_REPORTS;
  await supabase.from("quest_items").update({ report_count: reports, ...(pulled ? { status: "draft" } : {}) }).eq("id", id);
  return NextResponse.json({ success: true, pulled });
}
