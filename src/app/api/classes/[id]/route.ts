import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Teachers update a class's settings, e.g. { allow_research_mode: false }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: classId } = await params;
    const { settings } = await req.json();
    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Missing settings" }, { status: 400 });
    }

    const { data: cls } = await supabase
      .from("classes")
      .select("teacher_id, settings")
      .eq("id", classId)
      .maybeSingle();

    if (!cls) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }
    if (cls.teacher_id !== user.id) {
      return NextResponse.json({ error: "Only the class teacher can change its settings" }, { status: 403 });
    }

    // Only known settings are accepted
    const updates: Record<string, boolean> = {};
    if (typeof settings.allow_research_mode === "boolean") {
      updates.allow_research_mode = settings.allow_research_mode;
    }

    const { data: updated, error } = await supabase
      .from("classes")
      .update({ settings: { ...(cls.settings ?? {}), ...updates } })
      .eq("id", classId)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to update class", details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Classes API PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
