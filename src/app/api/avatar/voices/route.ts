import { NextRequest, NextResponse } from "next/server";
import { requireTeacher } from "@/lib/api-auth";
import { isVoiceConfigured, listVoices } from "@/lib/elevenlabs";

// Voices a teacher can pick for their AI Teacher
export async function GET(req: NextRequest) {
  const auth = await requireTeacher(req);
  if (auth.error) return auth.error;

  if (!isVoiceConfigured()) {
    return NextResponse.json({ configured: false, voices: [] });
  }
  try {
    return NextResponse.json({ configured: true, voices: await listVoices() });
  } catch (error) {
    console.error("Failed to list voices:", error);
    // Include ElevenLabs' status (e.g. 401 = key lacks the Voices permission) so it can be fixed
    const detail = error instanceof Error ? error.message.replace(/^ElevenLabs voices request failed: /, "") : "";
    return NextResponse.json({ configured: true, voices: [], error: `Couldn't load voices right now${detail ? ` (ElevenLabs status ${detail})` : ""}` });
  }
}
