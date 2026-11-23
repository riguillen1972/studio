"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toSpokenMath } from "@/lib/speech-text";

/** Sentences short enough that Chrome doesn't cut off long utterances. */
function sentences(text: string): string[] {
  return toSpokenMath(text).split(/(?<=[.!?])\s+/).flatMap((s) => {
    if (s.length <= 220) return [s];
    return s.split(/(?<=[,;])\s+/);
  }).filter((s) => s.trim());
}

// Natural-sounding English voices by kind, best first (names differ by device and browser)
const VOICES_BY_HINT = {
  female: ["Samantha", "Google US English", "Microsoft Aria", "Microsoft Jenny", "Karen", "Moira", "Google UK English Female"],
  male: ["Daniel", "Alex", "Microsoft Guy", "Microsoft Davis", "Google UK English Male", "Fred"],
} as const;

function pickVoice(hint?: "female" | "male"): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("en"));
  const preferred = hint ? [...VOICES_BY_HINT[hint], ...VOICES_BY_HINT[hint === "male" ? "female" : "male"]] : VOICES_BY_HINT.female;
  return preferred.map((n) => voices.find((v) => v.name.includes(n))).find(Boolean)
    ?? voices.find((v) => v.lang === "en-US") ?? voices[0] ?? null;
}

/**
 * Reads a list of sections aloud with the browser's built-in voice (free, works offline on most
 * devices), one sentence at a time so it can pause, resume and report which section it's on.
 */
export function useReadAloud() {
  const [supported, setSupported] = useState(false);
  const [section, setSection] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const queue = useRef<{ section: number; text: string }[]>([]);
  const position = useRef(0);
  const run = useRef(0);
  const rateRef = useRef(1);
  const hintRef = useRef<"female" | "male" | undefined>(undefined);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => { run.current++; if (typeof window !== "undefined") window.speechSynthesis?.cancel(); };
  }, []);
  useEffect(() => { rateRef.current = rate; }, [rate]);

  const speakFrom = useCallback((index: number) => {
    const id = ++run.current;
    window.speechSynthesis.cancel();
    const next = (i: number) => {
      if (id !== run.current) return;
      const item = queue.current[i];
      position.current = i;
      if (!item) { setSection(null); return; }
      setSection(item.section);
      const u = new SpeechSynthesisUtterance(item.text);
      const voice = pickVoice(hintRef.current);
      if (voice) u.voice = voice;
      u.lang = voice?.lang ?? "en-US";
      u.rate = rateRef.current;
      u.onend = () => next(i + 1);
      u.onerror = (e) => { if (e.error !== "interrupted" && e.error !== "canceled") next(i + 1); };
      window.speechSynthesis.speak(u);
    };
    setPaused(false);
    next(index);
  }, []);

  /** Starts reading the sections from `from`, in a voice of the given kind if the device has one. */
  const play = useCallback((texts: string[], from = 0, voiceHint?: "female" | "male") => {
    hintRef.current = voiceHint;
    queue.current = texts.flatMap((t, s) => (s < from ? [] : sentences(t).map((text) => ({ section: s, text }))));
    speakFrom(0);
  }, [speakFrom]);

  const pause = useCallback(() => {
    run.current++;
    window.speechSynthesis.cancel();
    setPaused(true);
  }, []);

  const resume = useCallback(() => speakFrom(position.current), [speakFrom]);

  const stop = useCallback(() => {
    run.current++;
    window.speechSynthesis?.cancel();
    setSection(null);
    setPaused(false);
  }, []);

  return { supported, section, speaking: section !== null && !paused, paused, rate, setRate, play, pause, resume, stop };
}
