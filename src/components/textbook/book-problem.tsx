"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Markdown } from "@/components/markdown";
import { CheckCircle2, Lightbulb, MessageCircle, XCircle } from "lucide-react";
import { feedbackFor, isRight, type BookProblem } from "@/lib/textbook-lesson";

/** What happened when the student checked an answer, so the mentor can react. */
export interface ProblemEvent {
  right: boolean;
  /** Tries so far, including this one. */
  tries: number;
  /** What the student should hear: why it's right, or what went wrong and a hint. */
  message: string;
  /** True once the solution is showing (right, or after 3 tries). */
  done: boolean;
}

const MAX_TRIES = 3;

/**
 * One problem the student answers. A wrong answer gets feedback that names the mistake when we
 * know it, otherwise the next hint; after 3 tries, the worked solution. Research on feedback:
 * explaining why helps far more than just marking it wrong.
 */
export function BookProblemCard({ problem, label, onResult, onAskMentor, mentorName }: {
  problem: BookProblem;
  label?: string;
  onResult?: (e: ProblemEvent) => void;
  /** Shows "Ask <mentor>" for help with this problem. */
  onAskMentor?: (response: string | null) => void;
  mentorName?: string;
}) {
  const [response, setResponse] = useState("");
  const [tries, setTries] = useState(0);
  const [right, setRight] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hintsShown, setHintsShown] = useState(0);
  const done = right || tries >= MAX_TRIES;

  const check = (value: string) => {
    if (!value.trim() || done) return;
    const t = tries + 1;
    setTries(t);
    if (isRight(problem, value)) {
      setRight(true);
      const msg = t === 1 ? "That's right!" : "You stuck with it and got it. That's how learning works!";
      setMessage(msg);
      onResult?.({ right: true, tries: t, message: msg, done: true });
      return;
    }
    const known = feedbackFor(problem, value);
    const hint = problem.hints[Math.min(t - 1, problem.hints.length - 1)];
    const msg = t >= MAX_TRIES
      ? `Not yet, and that's okay. Let's look at the steps together, then you'll be ready for the next one.`
      : `Not yet. ${known ?? `Hint: ${hint}`}`;
    if (!known) setHintsShown((h) => Math.max(h, Math.min(t, problem.hints.length)));
    setMessage(msg);
    onResult?.({ right: false, tries: t, message: msg, done: t >= MAX_TRIES });
  };

  return (
    <div className="space-y-3 rounded-xl border-2 border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
      {label && <p className="text-xs font-bold uppercase tracking-wide text-primary">{label}</p>}
      <div className="text-lg font-medium"><Markdown>{problem.question}</Markdown></div>

      {problem.kind === "multiple_choice" ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {problem.choices?.map((c) => {
            const picked = response === c;
            const state = done && c === problem.answer ? "right" : picked && message && !right ? "wrong" : "";
            return (
              <button key={c} type="button" disabled={done}
                onClick={() => { setResponse(c); check(c); }}
                className={`rounded-lg border-2 px-3 py-2 text-left transition-colors disabled:cursor-default ${
                  state === "right" ? "border-green-500 bg-green-500/10" : state === "wrong" ? "border-amber-500 bg-amber-500/10" : "border-black/10 hover:border-primary dark:border-white/15"}`}>
                {c}
              </button>
            );
          })}
        </div>
      ) : (
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); check(response); }}>
          <Input value={response} onChange={(e) => setResponse(e.target.value)} disabled={done} inputMode="text"
            placeholder="Your answer" aria-label="Your answer" className="max-w-[12rem] bg-background text-lg" />
          <Button type="submit" disabled={!response.trim() || done}>Check</Button>
        </form>
      )}

      {!done && (
        <div className="flex flex-wrap gap-2">
          {hintsShown < problem.hints.length && (
            <Button size="sm" variant="ghost" onClick={() => setHintsShown((h) => h + 1)}><Lightbulb className="mr-1.5 h-4 w-4" /> Hint</Button>
          )}
          {onAskMentor && (
            <Button size="sm" variant="ghost" onClick={() => onAskMentor(response.trim() || null)}>
              <MessageCircle className="mr-1.5 h-4 w-4" /> Ask {mentorName ?? "for help"}
            </Button>
          )}
        </div>
      )}
      {hintsShown > 0 && !done && (
        <ul className="space-y-1 text-sm">
          {problem.hints.slice(0, hintsShown).map((h, i) => <li key={i} className="flex gap-2"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /> {h}</li>)}
        </ul>
      )}

      {message && (
        <motion.div key={`${tries}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className={`flex gap-2 rounded-lg p-3 text-sm ${right ? "bg-green-500/10 text-green-900 dark:text-green-200" : "bg-amber-500/10 text-amber-950 dark:text-amber-100"}`}>
          {right ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />}
          <span>{mentorName && <b>{mentorName}: </b>}{message}</span>
        </motion.div>
      )}

      {done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg bg-black/[0.03] p-3 text-sm dark:bg-white/5">
          <p className="mb-1 font-semibold">{right ? "Why it works" : `The answer is ${problem.answer}. Here's how:`}</p>
          <ol className="list-decimal space-y-0.5 pl-5">{problem.solution.map((s, i) => <li key={i}><Markdown>{s}</Markdown></li>)}</ol>
        </motion.div>
      )}
    </div>
  );
}
