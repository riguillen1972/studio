import { useState, useEffect, useRef, useCallback } from 'react';
import { FocusTrack } from '@/lib/focusTracks';

export function useFocusAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7); // Default 70%
  const [currentTrack, setCurrentTrack] = useState<FocusTrack | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize or update audio element when track changes
  useEffect(() => {
    if (!currentTrack) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        setIsPlaying(false);
      }
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(currentTrack.url);
      audioRef.current.loop = true;
      audioRef.current.volume = volume;
    } else {
      // Only change source if it's different to prevent resetting playback
      if (audioRef.current.src !== currentTrack.url) {
        const wasPlaying = !audioRef.current.paused;
        audioRef.current.src = currentTrack.url;
        audioRef.current.load();
        
        if (wasPlaying) {
          audioRef.current.play().catch(e => {
            console.error("Failed to play audio:", e);
            setError("Failed to play audio track.");
            setIsPlaying(false);
          });
        }
      }
    }
  }, [currentTrack]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const play = useCallback(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setError(null);
      }).catch(e => {
        console.error("Audio playback error:", e);
        setError("Playback blocked by browser. Please interact with the page first.");
        setIsPlaying(false);
      });
    }
  }, [currentTrack]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  return {
    currentTrack,
    setCurrentTrack,
    isPlaying,
    volume,
    setVolume,
    play,
    pause,
    toggle,
    stop,
    error,
  };
}
