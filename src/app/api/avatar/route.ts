import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/api-auth";
import { getAdminClient } from "@/lib/usage";
import { MIN_VOICE_SPEED, MAX_VOICE_SPEED } from "@/lib/elevenlabs";

const TEXT_FIELDS = {
  name: 60,
  title: 80,
  backstory: 1000,
  greeting_phrase: 200,
  sign_off_phrase: 200,
  teaching_method: 30,
  adaptation_style: 30,
  never_do: 1000,
  special_instructions: 2000,
  voice_id: 60,
} as const;
const SLIDER_FIELDS = ["warmth", "energy", "strictness", "humor"] as const;

// The teacher's saved AI Teacher (one per teacher; the latest row is used)
export async function GET(req: NextRequest) {
  const auth = await requireTeacher(req);
  if (auth.error) return auth.error;

  const { data, error } = await getAdminClient()
    .from("avatar_configs")
    .select("*")
    .eq("teacher_id", auth.user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Avatar GET error:", error);
    return NextResponse.json({ error: "Failed to load your AI Teacher" }, { status: 500 });
  }
  return NextResponse.json({ data });
}

export async function PUT(req: NextRequest) {
  const auth = await requireTeacher(req, { requireMax: true });
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const config: Record<string, string | number | null> = {};
  for (const [field, max] of Object.entries(TEXT_FIELDS)) {
    const value = body[field];
    if (value === undefined || value === null || value === "") {
      config[field] = null;
    } else if (typeof value !== "string" || value.length > max) {
      return NextResponse.json({ error: `${field} must be text up to ${max} characters` }, { status: 400 });
    } else {
      config[field] = value.trim();
    }
  }
  if (!config.name) {
    return NextResponse.json({ error: "Give your AI Teacher a name" }, { status: 400 });
  }
  for (const field of SLIDER_FIELDS) {
    const value = Number(body[field]);
    if (!Number.isInteger(value) || value < 1 || value > 10) {
      return NextResponse.json({ error: `${field} must be a whole number from 1 to 10` }, { status: 400 });
    }
    config[field] = value;
  }
  if (body.voice_speed !== undefined && body.voice_speed !== null) {
    const speed = Number(body.voice_speed);
    if (!Number.isFinite(speed) || speed < MIN_VOICE_SPEED || speed > MAX_VOICE_SPEED) {
      return NextResponse.json({ error: `voice_speed must be between ${MIN_VOICE_SPEED} and ${MAX_VOICE_SPEED}` }, { status: 400 });
    }
    config.voice_speed = Math.round(speed * 100) / 100;
  }

  const supabase = getAdminClient();
  const { data: existing } = await supabase
    .from("avatar_configs")
    .select("id")
    .eq("teacher_id", auth.user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const row = { ...config, teacher_id: auth.user.id, updated_at: new Date().toISOString() };
  const { data, error } = existing
    ? await supabase.from("avatar_configs").update(row).eq("id", existing.id).select("*").single()
    : await supabase.from("avatar_configs").insert(row).select("*").single();

  if (error) {
    console.error("Avatar save error:", error);
    return NextResponse.json({ error: "Failed to save your AI Teacher" }, { status: 500 });
  }
  return NextResponse.json({ data });
}
