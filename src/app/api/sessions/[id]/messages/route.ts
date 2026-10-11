import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/api-auth";
import { getAdminClient } from "@/lib/usage";
import {
  MAX_CLASS_MESSAGES,
  MAX_MESSAGE_CHARS,
  addUsage,
  emptyCost,
  runTeacherTurn,
  type SessionCost,
  type StoredHistory,
} from "@/lib/live-session";

export const maxDuration = 60;

// Send what the class said; returns the avatar's reply
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireTeacher(req, { requireMax: true });
    if (auth.error) return auth.error;
    const { id } = await params;
    const supabase = getAdminClient();

    const { text } = await req.json().catch(() => ({}));
    const message = typeof text === "string" ? text.trim() : "";
    if (!message) {
      return NextResponse.json({ error: "Type what the class said" }, { status: 400 });
    }
    if (message.length > MAX_MESSAGE_CHARS) {
      return NextResponse.json({ error: `Keep messages under ${MAX_MESSAGE_CHARS} characters` }, { status: 400 });
    }

    const { data: session } = await supabase
      .from("session_records")
      .select("id, teacher_id, status, session_history, cost_breakdown")
      .eq("id", id)
      .maybeSingle();

    if (!session || session.teacher_id !== auth.user.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (session.status !== "active") {
      return NextResponse.json({ error: "This session has ended" }, { status: 409 });
    }

    const history = session.session_history as StoredHistory;
    const classMessages = history.messages.filter((m) => m.role === "user").length - 1; // minus the kickoff
    if (classMessages >= MAX_CLASS_MESSAGES) {
      return NextResponse.json({ error: "This session has reached its message limit. End it and start a new one." }, { status: 409 });
    }

    // Append-only: earlier turns are replayed exactly as stored
    const next: StoredHistory = {
      system: history.system,
      messages: [...history.messages, { role: "user", content: message }],
    };
    const turn = await runTeacherTurn(next);

    if (turn.refused || !turn.text) {
      // Nothing is saved, so the class message can be rephrased and sent again
      return NextResponse.json({ error: "The AI Teacher couldn't respond to that. Try rephrasing." }, { status: 422 });
    }
    next.messages.push({ role: "assistant", content: turn.content });

    const cost = addUsage((session.cost_breakdown as SessionCost | null) ?? emptyCost(), turn.usage);
    const { error } = await supabase
      .from("session_records")
      .update({ session_history: next, cost_breakdown: cost })
      .eq("id", id);
    if (error) {
      console.error("Failed to save session turn:", error);
      return NextResponse.json({ error: "Failed to save the reply" }, { status: 500 });
    }

    return NextResponse.json({ reply: turn.text });
  } catch (error) {
    console.error("Session message error:", error);
    return NextResponse.json({ error: "The AI Teacher couldn't respond. Please try again." }, { status: 500 });
  }
}
