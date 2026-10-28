import { NextRequest, NextResponse } from "next/server";
import { studentOverview } from "@/lib/quest/engine";
import { unauthorized, userIdFrom } from "@/lib/quest/api";

// The student's Math Quest status: diagnostic, today's progress, skills
export async function GET(req: NextRequest) {
  const userId = await userIdFrom(req);
  if (!userId) return unauthorized();
  return NextResponse.json(await studentOverview(userId));
}
