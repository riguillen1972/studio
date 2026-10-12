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
    return NextResponse.json({ configured: true, voices: [], error: "Couldn't load voices right now" });
  }
}
