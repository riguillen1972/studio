"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toSpeakableText } from "@/lib/speech-text";

type Mode = "elevenlabs" | "browser";

/**
 * Speaks the AI Teacher's replies. Uses the avatar's ElevenLabs voice through
 * /api/sessions/[id]/speech, and falls back to the browser's built-in voice (free)
 * when ElevenLabs isn't set up or no voice is chosen. Audio is cached per reply,
 * so replaying a reply doesn't pay for it again.
 */
export function useAvatarVoice(sessionId: string | null) {
  const [enabled, setEnabled] = useState(true);
  const [speakingTurn, setSpeakingTurn] = useState<number | null>(null);
  const [loadingTurn, setLoadingTurn] = useState<number | null>(null);
  const [blockedTurn, setBlockedTurn] = useState<number | null>(null);
  const modeRef = useRef<Mode>("elevenlabs");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef(new Map<number, string>());

  const stop = useCallback(() => {
    audioRef.current?.pause();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setSpeakingTurn(null);
  }, []);

  // New session: forget cached audio from the previous one
  useEffect(() => {
    const cache = cacheRef.current;
    modeRef.current = "elevenlabs";
    return () => {
      stop();
      cache.forEach((url) => URL.revokeObjectURL(url));
      cache.clear();
    };
  }, [sessionId, stop]);

  const speakWithBrowser = useCallback((turn: number, text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(toSpeakableText(text));
    utterance.onend = () => setSpeakingTurn((t) => (t === turn ? null : t));
    utterance.onerror = () => setSpeakingTurn((t) => (t === turn ? null : t));
    setSpeakingTurn(turn);
    window.speechSynthesis.speak(utterance);
  }, []);

  const playUrl = useCallback(async (turn: number, url: string) => {
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    audio.src = url;
    audio.onended = () => setSpeakingTurn((t) => (t === turn ? null : t));
    setSpeakingTurn(turn);
    try {
      await audio.play();
      setBlockedTurn(null);
    } catch {
      // The browser blocked autoplay; the teacher can tap the speaker button
      setSpeakingTurn(null);
      setBlockedTurn(turn);
    }
  }, []);

  /** Speaks the Nth avatar reply (0-based). */
  const speak = useCallback(async (turn: number, text: string) => {
    if (!sessionId) return;
    stop();

    if (modeRef.current === "browser") {
      speakWithBrowser(turn, text);
      return;
    }

    const cached = cacheRef.current.get(turn);
    if (cached) {
      await playUrl(turn, cached);
      return;
    }

    setLoadingTurn(turn);
    try {
      const { data: { session } } = await createClient().auth.getSession();
      if (!session) return;
      const res = await fetch(`/api/sessions/${sessionId}/speech?turn=${turn}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.code === "voice_unavailable" || data.code === "no_voice") modeRef.current = "browser";
        speakWithBrowser(turn, text);
        return;
      }
      const url = URL.createObjectURL(await res.blob());
      cacheRef.current.set(turn, url);
      await playUrl(turn, url);
    } catch (e) {
      console.error("Voice playback failed:", e);
      speakWithBrowser(turn, text);
    } finally {
      setLoadingTurn((t) => (t === turn ? null : t));
    }
  }, [sessionId, stop, speakWithBrowser, playUrl]);

  const toggle = useCallback(() => {
    setEnabled((on) => {
      if (on) stop();
      return !on;
    });
  }, [stop]);

  return { enabled, toggle, speak, stop, speakingTurn, loadingTurn, blockedTurn };
}
