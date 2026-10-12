import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/api-auth";
import { getAdminClient } from "@/lib/usage";
import { emptyCost, toDisplay, type SessionCost, type StoredHistory } from "@/lib/live-session";
import { isVoiceConfigured, synthesizeSpeech } from "@/lib/elevenlabs";
import { toSpeakableText } from "@/lib/speech-text";

export const maxDuration = 30;

// Speaks one of the AI Teacher's replies in this session: ?turn=N is the Nth avatar message (0-based).
// Only the avatar's own replies can be spoken, so this can't be used as a general text-to-speech service.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireTeacher(req, { requireMax: true });
    if (auth.error) return auth.error;
    const { id } = await params;

    if (!isVoiceConfigured()) {
      return NextResponse.json({ error: "Voice isn't set up", code: "voice_unavailable" }, { status: 503 });
    }

    const turn = Number(req.nextUrl.searchParams.get("turn"));
    if (!Number.isInteger(turn) || turn < 0) {
      return NextResponse.json({ error: "Invalid turn" }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { data: session } = await supabase
      .from("session_records")
      .select("teacher_id, session_history, cost_breakdown, avatar_configs(voice_id, voice_speed)")
      .eq("id", id)
      .maybeSingle();
    if (!session || session.teacher_id !== auth.user.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const avatar = (Array.isArray(session.avatar_configs) ? session.avatar_configs[0] : session.avatar_configs) as
      { voice_id: string | null; voice_speed: number | null } | null;
    if (!avatar?.voice_id) {
      return NextResponse.json({ error: "Choose a voice for your AI Teacher first", code: "no_voice" }, { status: 400 });
    }

    const replies = toDisplay(session.session_history as StoredHistory).filter((m) => m.role === "avatar");
    const reply = replies[turn];
    if (!reply) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }

    const text = toSpeakableText(reply.text);
    const audio = await synthesizeSpeech(avatar.voice_id, text, avatar.voice_speed ?? 1);
    if (!audio.ok || !audio.body) {
      console.error("ElevenLabs TTS failed:", audio.status, await audio.text().catch(() => ""));
      return NextResponse.json({ error: "Couldn't create the voice audio", code: "voice_failed" }, { status: 502 });
    }

    // Track characters spoken for cost monitoring (the client caches audio, so replays aren't re-billed)
    const cost = (session.cost_breakdown as SessionCost | null) ?? emptyCost();
    await supabase
      .from("session_records")
      .update({ cost_breakdown: { ...cost, tts_characters: (cost.tts_characters ?? 0) + text.length } })
      .eq("id", id);

    return new Response(audio.body, {
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=3600" },
    });
  } catch (error) {
    console.error("Speech error:", error);
    return NextResponse.json({ error: "Couldn't create the voice audio", code: "voice_failed" }, { status: 500 });
  }
}
