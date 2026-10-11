import { NextRequest, NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { getAdminClient } from "@/lib/usage";

type TeacherResult =
  | { user: User; tier: string; error?: undefined }
  | { error: NextResponse; user?: undefined; tier?: undefined };

/** Verifies the bearer token and that the user is a teacher. Optionally requires the Max tier. */
export async function requireTeacher(req: NextRequest, opts: { requireMax?: boolean } = {}): Promise<TeacherResult> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 }) };
  }

  const supabase = getAdminClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.split(" ")[1]);
  if (authError || !user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, tier")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "teacher") {
    return { error: NextResponse.json({ error: "Only teachers can use the AI Teacher" }, { status: 403 }) };
  }
  if (opts.requireMax && profile.tier !== "max") {
    return { error: NextResponse.json({ error: "The AI Teacher is part of the Max plan" }, { status: 403 }) };
  }

  return { user, tier: profile.tier ?? "free" };
}
