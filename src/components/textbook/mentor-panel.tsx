"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Markdown } from "@/components/markdown";
import { Loader2, Send } from "lucide-react";
import { MentorAvatar, type MentorMood } from "@/components/mentor/mentor-avatar";
import { MENTORS_BY_ID, type MentorId } from "@/lib/mentors";
import { askMentorAction } from "@/lib/actions";
import { useAppState } from "@/components/app-state-provider";

interface Turn { role: "user" | "ai"; content: string }

/**
 * The mentor beside the textbook: says something about each page, reacts to the student, and
 * answers questions about the page they're on.
 */
export function MentorPanel({ mentorId, skillId, line, pageText, mood: outsideMood, onChangeMentor, request }: {
  mentorId: MentorId;
  skillId: string;
  /** What the mentor says about the current page. */
  line: string;
  pageText: string;
  /** A mood set by the page (talking while reading aloud, cheering after a right answer). */
  mood?: MentorMood | null;
  onChangeMentor: () => void;
  /** A question sent from the page (like "Help me with worksheet problem 3"); a new id sends it. */
  request?: { id: number; text: string; pageText: string } | null;
}) {
  const mentor = MENTORS_BY_ID[mentorId];
  const { tier, hasTokens, consumeTokens } = useAppState();
  const model = tier === "free" ? "gemma3" : "haiku";
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // A new lesson starts a new conversation
  useEffect(() => { setTurns([]); setError(null); }, [skillId]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [turns, thinking]);

  const send = async (q: string, aboutPage = pageText) => {
    if (!q || thinking) return;
    if (!hasTokens(model)) return setError("You've used this month's tokens. They reset on the 1st of next month.");
    setError(null);
    const history = turns;
    setTurns([...history, { role: "user", content: q }]);
    setThinking(true);
    const result = await askMentorAction({ skillId, mentorId, question: q, pageText: aboutPage.slice(0, 3000), conversationHistory: history.slice(-8), model });
    setThinking(false);
    if (result.success) {
      consumeTokens(result.data.totalTokens, model);
      setTurns((t) => [...t, { role: "ai", content: result.data.response }]);
    } else {
      setError(result.error);
    }
  };

  const ask = (e: React.FormEvent) => {
    e.preventDefault();
    const q = question.trim();
    if (!q || thinking) return;
    setQuestion("");
    send(q);
  };

  // A help request from the page
  const lastRequest = useRef<number | null>(null);
  useEffect(() => {
    if (!request || request.id === lastRequest.current) return;
    lastRequest.current = request.id;
    send(request.text, request.pageText);
    endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request]);

  const mood: MentorMood = thinking ? "thinking" : outsideMood ?? "happy";

  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 bg-card p-4" style={{ borderColor: `${mentor.color}55` }}>
      <div className="flex items-end gap-3">
        <MentorAvatar mentorId={mentorId} mood={mood} size={92} className="shrink-0" />
        <AnimatePresence mode="wait">
          <motion.div
            key={line}
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className="relative mb-6 rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-gray-900 shadow-sm"
            style={{ backgroundColor: mentor.accent }}
          >
            {line}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-semibold" style={{ color: mentor.color }}>{mentor.name}, your mentor</span>
        <button type="button" className="hover:underline" onClick={onChangeMentor}>Change mentor</button>
      </div>

      {(turns.length > 0 || thinking) && (
        <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl bg-muted/40 p-2 text-sm">
          {turns.map((t, i) => (
            <div key={i} className={t.role === "user" ? "ml-6 rounded-xl bg-primary/15 px-3 py-2" : "mr-6 rounded-xl bg-background px-3 py-2"}>
              {t.role === "ai" ? <Markdown>{t.content}</Markdown> : t.content}
            </div>
          ))}
          {thinking && <p className="flex items-center gap-2 px-2 text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> {mentor.name} is thinking…</p>}
          <div ref={endRef} />
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}

      <form onSubmit={ask} className="flex gap-2">
        <Input value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={1000}
          placeholder={`Ask ${mentor.name} about this page…`} aria-label={`Ask ${mentor.name}`} disabled={thinking} />
        <Button type="submit" size="icon" disabled={!question.trim() || thinking} aria-label="Send" style={{ backgroundColor: mentor.color }}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
