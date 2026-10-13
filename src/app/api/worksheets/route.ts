import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/api-auth";
import { checkUsage, recordUsage } from "@/lib/usage";
import { generateWorksheet, type WorksheetRequest } from "@/lib/worksheet";

export const maxDuration = 60;

const STYLES = ["mixed", "multiple_choice", "short_answer", "word_problems"];
const GRADES = [...Array.from({ length: 12 }, (_, i) => String(i + 1)), "college"];

// Teacher Max: generate a worksheet with an answer key
export async function POST(req: NextRequest) {
  try {
    const auth = await requireTeacher(req, { requireMax: true });
    if (auth.error) return auth.error;

    const body = await req.json().catch(() => ({}));
    const request = typeof body.request === "string" ? body.request.trim() : "";
    const questionCount = Number(body.questionCount);
    if (request.length < 5 || request.length > 2000) {
      return NextResponse.json({ error: "Describe the worksheet in 5 to 2,000 characters" }, { status: 400 });
    }
    if (!GRADES.includes(body.grade)) {
      return NextResponse.json({ error: "Choose a grade" }, { status: 400 });
    }
    if (!Number.isInteger(questionCount) || questionCount < 3 || questionCount > 30) {
      return NextResponse.json({ error: "Choose between 3 and 30 questions" }, { status: 400 });
    }
    if (!STYLES.includes(body.questionStyle)) {
      return NextResponse.json({ error: "Choose a question style" }, { status: 400 });
    }

    // Counts against the Max plan's monthly Claude allowance
    const usageError = await checkUsage(auth.user.id, "haiku");
    if (usageError) {
      return NextResponse.json({ error: usageError }, { status: 402 });
    }

    const { worksheet, totalTokens } = await generateWorksheet({
      request,
      grade: body.grade,
      questionCount,
      questionStyle: body.questionStyle as WorksheetRequest["questionStyle"],
    });
    await recordUsage(auth.user.id, "haiku", totalTokens).catch((e) => console.error("Failed to record usage:", e));

    return NextResponse.json({ worksheet });
  } catch (error) {
    console.error("Worksheet generation error:", error);
    const message = error instanceof Error && error.message.startsWith("The AI") ? error.message : "Couldn't create the worksheet. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
