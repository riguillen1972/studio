"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/supabase/auth-provider";
import { createClient } from "@/lib/supabase/client";
import type { FocusTrack } from "@/lib/focusTracks";

// Focus Mode lives in the app layout (not the Focus page) so the timer and focus audio
// keep going while students use other parts of the app.

export const FOCUS_SECONDS = 25 * 60;
export const BREAK_SECONDS = 5 * 60;

type FocusMode = "focus" | "break";

interface FocusState {
  mode: FocusMode;
  timeLeft: number;
  isActive: boolean;
  /** A session was started and not reset, even if it's paused right now. */
  inSession: boolean;
  currentTrack: FocusTrack | null;
  isPlaying: boolean;
  volume: number;
  error: string | null;
  toggleTimer: () => void;
  resetTimer: () => void;
  setMode: (mode: FocusMode) => void;
  selectTrack: (track: FocusTrack) => void;
  setVolume: (volume: number) => void;
}

const FocusContext = createContext<FocusState | undefined>(undefined);

export function FocusProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [mode, setModeState] = useState<FocusMode>("focus");
  const [timeLeft, setTimeLeft] = useState(FOCUS_SECONDS);
  const [isActive, setIsActive] = useState(false);
  // When running, the timer counts down to this moment, so it stays accurate even if the tab is in the background
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [currentTrack, setCurrentTrack] = useState<FocusTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.7);
  const [error, setError] = useState<string | null>(null);

  const getAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
    }
    return audioRef.current;
  };

  const playTrack = useCallback((track: FocusTrack | null) => {
    if (!track) return;
    const audio = getAudio();
    audio.volume = volume;
    if (audio.src !== track.url) audio.src = track.url;
    audio.play().then(() => {
      setIsPlaying(true);
      setError(null);
    }).catch((e) => {
      console.error("Focus audio playback error:", e);
      setError("Your browser blocked the audio. Press Start again to play it.");
      setIsPlaying(false);
    });
  }, [volume]);

  const pauseAudio = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  // Stop audio when the user signs out or the app layout unmounts
  useEffect(() => () => { audioRef.current?.pause(); }, []);
  useEffect(() => {
    if (!user) pauseAudio();
  }, [user, pauseAudio]);

  // Countdown
  useEffect(() => {
    if (!isActive || endsAt === null) return;
    const tick = () => setTimeLeft(Math.max(0, Math.round((endsAt - Date.now()) / 1000)));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isActive, endsAt]);

  // Finished a focus period or a break
  useEffect(() => {
    if (!isActive || timeLeft > 0) return;
    setIsActive(false);
    setEndsAt(null);
    pauseAudio();

    if (mode === "focus" && user && currentTrack) {
      createClient().from("focus_sessions").insert({
        user_id: user.id,
        sound_id: currentTrack.id,
        duration_minutes: FOCUS_SECONDS / 60,
        completed: true,
      }).then(({ error }) => { if (error) console.error("Failed to save focus session:", error); });
    }

    const next: FocusMode = mode === "focus" ? "break" : "focus";
    setModeState(next);
    setTimeLeft(next === "focus" ? FOCUS_SECONDS : BREAK_SECONDS);
  }, [isActive, timeLeft, mode, user, currentTrack, pauseAudio]);

  const toggleTimer = useCallback(() => {
    if (isActive) {
      setIsActive(false);
      setEndsAt(null);
      pauseAudio();
    } else {
      setEndsAt(Date.now() + timeLeft * 1000);
      setIsActive(true);
      if (mode === "focus") playTrack(currentTrack);
    }
  }, [isActive, timeLeft, mode, currentTrack, playTrack, pauseAudio]);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setEndsAt(null);
    pauseAudio();
    setTimeLeft(mode === "break" ? BREAK_SECONDS : FOCUS_SECONDS);
  }, [mode, pauseAudio]);

  const setMode = useCallback((next: FocusMode) => {
    setIsActive(false);
    setEndsAt(null);
    pauseAudio();
    setModeState(next);
    setTimeLeft(next === "break" ? BREAK_SECONDS : FOCUS_SECONDS);
  }, [pauseAudio]);

  const selectTrack = useCallback((track: FocusTrack) => {
    setCurrentTrack(track);
    // Switch tracks immediately if a focus period is running
    if (isActive && mode === "focus") playTrack(track);
  }, [isActive, mode, playTrack]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  const fullTime = mode === "break" ? BREAK_SECONDS : FOCUS_SECONDS;
  const value = useMemo<FocusState>(() => ({
    mode, timeLeft, isActive, inSession: isActive || timeLeft < fullTime,
    currentTrack, isPlaying, volume, error,
    toggleTimer, resetTimer, setMode, selectTrack, setVolume,
  }), [mode, timeLeft, isActive, fullTime, currentTrack, isPlaying, volume, error, toggleTimer, resetTimer, setMode, selectTrack, setVolume]);

  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>;
}

export function useFocus() {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error("useFocus must be used within a FocusProvider");
  return ctx;
}

export const formatFocusTime = (seconds: number) =>
  `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
