// Server-only: ElevenLabs text-to-speech for the AI Teacher's voice.
// Uses the Flash model: about half the price per character of the standard models,
// with latency that's fine for a classroom.

const API_BASE = "https://api.elevenlabs.io";
export const TTS_MODEL = "eleven_flash_v2_5";
export const MAX_SPEECH_CHARS = 1500;
// ElevenLabs accepts speaking speeds in this range
export const MIN_VOICE_SPEED = 0.7;
export const MAX_VOICE_SPEED = 1.2;

export const isVoiceConfigured = () => !!process.env.ELEVENLABS_API_KEY;

export interface VoiceOption {
  voice_id: string;
  name: string;
  description: string | null;
  labels: Record<string, string>;
  preview_url: string | null;
}

/** Voices available on the ElevenLabs account: the default voices plus any the owner added. */
export async function listVoices(): Promise<VoiceOption[]> {
  const res = await fetch(`${API_BASE}/v2/voices?page_size=100&include_total_count=false&sort=name&sort_direction=asc`, {
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`ElevenLabs voices request failed: ${res.status}`);
  const data = await res.json();
  return (data.voices ?? []).map((v: VoiceOption) => ({
    voice_id: v.voice_id,
    name: v.name,
    description: v.description ?? null,
    labels: v.labels ?? {},
    preview_url: v.preview_url ?? null,
  }));
}

/** Returns an MP3 audio response for the text. */
export async function synthesizeSpeech(voiceId: string, text: string, speed: number): Promise<Response> {
  const clampedSpeed = Math.min(MAX_VOICE_SPEED, Math.max(MIN_VOICE_SPEED, speed || 1));
  return fetch(`${API_BASE}/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY!, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text: text.slice(0, MAX_SPEECH_CHARS),
      model_id: TTS_MODEL,
      voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: clampedSpeed },
    }),
  });
}
