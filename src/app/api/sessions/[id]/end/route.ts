import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/api-auth";
import { getAdminClient } from "@/lib/usage";

// End a live session
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTeacher(req);
  if (auth.error) return auth.error;
  const { id } = await params;
  const supabase = getAdminClient();

  const { data: session } = await supabase
    .from("session_records")
    .select("teacher_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!session || session.teacher_id !== auth.user.id) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (session.status === "active") {
    await supabase
      .from("session_records")
      .update({ status: "completed", ended_at: new Date().toISOString() })
      .eq("id", id);
  }
  return NextResponse.json({ success: true });
}
