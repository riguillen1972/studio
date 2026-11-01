import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/usage";
import { studentReport } from "@/lib/quest/engine";
import { ownQuestClass, questStudentIds } from "@/lib/quest/teacher";
import { parseTzOffset } from "@/lib/quest/progress";

// Detailed reports for a teacher: ?student=<id> for one student, otherwise every grades 6–8
// student in the class (used for parent summaries). &tz= is the browser's timezone offset.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = await params;
  const owned = await ownQuestClass(req, classId);
  if (owned.error) return owned.error;

  const tz = parseTzOffset(req.nextUrl.searchParams.get("tz"));
  const studentIds = await questStudentIds(classId);
  const one = req.nextUrl.searchParams.get("student");
  if (one && !studentIds.includes(one)) return NextResponse.json({ error: "Student not found in this class" }, { status: 404 });

  const { data: teacher } = await getAdminClient().from("profiles").select("display_name").eq("id", owned.teacherId).maybeSingle();
  const reports = await Promise.all((one ? [one] : studentIds).map((sid) => studentReport(sid, tz)));
  return NextResponse.json({
    class_name: owned.cls.name,
    teacher_name: teacher?.display_name ?? null,
    reports: reports.sort((a, b) => a.student.name.localeCompare(b.student.name)),
  });
}
