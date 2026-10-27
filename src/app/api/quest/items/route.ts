import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/api-auth";
import { getAdminClient } from "@/lib/usage";

// Questions for one skill, for teachers reviewing the bank. ?skill_id=...&status=draft|approved|rejected
export async function GET(req: NextRequest) {
  const auth = await requireTeacher(req);
  if (auth.error) return auth.error;

  const skillId = req.nextUrl.searchParams.get("skill_id");
  const status = req.nextUrl.searchParams.get("status");
  if (!skillId) {
    return NextResponse.json({ error: "Missing skill_id" }, { status: 400 });
  }

  let query = getAdminClient()
    .from("quest_items")
    .select("id, skill_id, difficulty, kind, stem, choices, answer, explanation, status, created_at")
    .eq("skill_id", skillId)
    .order("difficulty", { ascending: true })
    .order("created_at", { ascending: true });
  if (status && ["draft", "approved", "rejected"].includes(status)) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) {
    console.error("Questions query failed:", error);
    return NextResponse.json({ error: "Failed to load questions" }, { status: 500 });
  }
  return NextResponse.json({ items: data ?? [] });
}
