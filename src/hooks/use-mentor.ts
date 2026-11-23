"use client";

import { useCallback, useEffect, useState } from "react";
import { isMentorId, type MentorId } from "@/lib/mentors";

const KEY = "studybuddy.mentor";

/** The student's chosen mentor, remembered on this device (null until they pick one). */
export function useMentorChoice() {
  const [mentorId, setMentorIdState] = useState<MentorId | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (isMentorId(saved)) setMentorIdState(saved);
    } catch { /* storage blocked: they'll just pick again */ }
    setLoaded(true);
  }, []);

  const setMentorId = useCallback((id: MentorId) => {
    setMentorIdState(id);
    try { localStorage.setItem(KEY, id); } catch { /* not saved, still works for this visit */ }
  }, []);

  return { mentorId, setMentorId, loaded };
}
