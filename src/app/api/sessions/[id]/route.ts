import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/api-auth";
import { getAdminClient } from "@/lib/usage";
import { toDisplay, type StoredHistory } from "@/lib/live-session";

// Load a session's transcript (to resume it)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTeacher(req);
  if (auth.error) return auth.error;
  const { id } = await params;

  const { data: session } = await getAdminClient()
    .from("session_records")
    .select("id, teacher_id, status, started_at, ended_at, session_history, cost_breakdown, classes(name), avatar_configs(name)")
    .eq("id", id)
    .maybeSingle();

  if (!session || session.teacher_id !== auth.user.id) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const one = <T,>(v: T | T[] | null) => (Array.isArray(v) ? v[0] : v);
  return NextResponse.json({
    session: {
      id: session.id,
      status: session.status,
      started_at: session.started_at,
      ended_at: session.ended_at,
      class_name: (one(session.classes) as { name?: string } | null)?.name ?? null,
      avatar_name: (one(session.avatar_configs) as { name?: string } | null)?.name ?? null,
      cost: session.cost_breakdown,
    },
    messages: toDisplay(session.session_history as StoredHistory),
  });
}
