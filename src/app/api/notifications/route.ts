import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/api-auth";
import { getAdminClient } from "@/lib/usage";

// The teacher's notifications (students leaving or switching out of their class)
export async function GET(req: NextRequest) {
  const auth = await requireTeacher(req);
  if (auth.error) return auth.error;

  const { data, error } = await getAdminClient()
    .from("teacher_notifications")
    .select("id, type, student_name, class_name, created_at, read_at")
    .eq("teacher_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    // Table not created yet: no notifications rather than an error
    console.error("Notifications query failed:", error);
    return NextResponse.json({ notifications: [] });
  }
  return NextResponse.json({ notifications: data ?? [] });
}

// Mark all as read
export async function PATCH(req: NextRequest) {
  const auth = await requireTeacher(req);
  if (auth.error) return auth.error;

  await getAdminClient()
    .from("teacher_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("teacher_id", auth.user.id)
    .is("read_at", null);
  return NextResponse.json({ success: true });
}
