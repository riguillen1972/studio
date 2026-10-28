import { NextRequest, NextResponse } from "next/server";
import { answerPractice, nextPractice } from "@/lib/quest/engine";
import { respond, unauthorized, userIdFrom } from "@/lib/quest/api";

// Next practice question for the student
export async function GET(req: NextRequest) {
  const userId = await userIdFrom(req);
  if (!userId) return unauthorized();
  return respond(await nextPractice(userId), 404);
}

// Answer a practice question: { item_id, response, phase: "practice" | "review", seconds }
export async function POST(req: NextRequest) {
  const userId = await userIdFrom(req);
  if (!userId) return unauthorized();
  const body = await req.json().catch(() => ({}));
  if (typeof body.item_id !== "string" || typeof body.response !== "string" || !body.response.trim()) {
    return NextResponse.json({ error: "Missing answer" }, { status: 400 });
  }
  const phase = body.phase === "review" ? "review" : "practice";
  return respond(await answerPractice(userId, body.item_id, body.response, phase, body.seconds));
}
