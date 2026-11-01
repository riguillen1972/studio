import { NextRequest, NextResponse } from "next/server";
import { studentOverview } from "@/lib/quest/engine";
import { unauthorized, userIdFrom } from "@/lib/quest/api";
import { parseTzOffset } from "@/lib/quest/progress";

// The student's Math Quest status: diagnostic, today's progress, streak and badges, skills. ?tz= browser timezone offset
export async function GET(req: NextRequest) {
  const userId = await userIdFrom(req);
  if (!userId) return unauthorized();
  return NextResponse.json(await studentOverview(userId, parseTzOffset(req.nextUrl.searchParams.get("tz"))));
}
