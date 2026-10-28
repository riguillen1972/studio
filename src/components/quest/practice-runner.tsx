"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Markdown } from "@/components/markdown";
import { CheckCircle2, Lightbulb, Loader2, Trophy, XCircle } from "lucide-react";
import { QuestionCard, type QuestQuestion } from "./question-card";
import { questFetch } from "./quest-api";

interface Next { question: QuestQuestion; phase: "practice" | "review"; reason: string }
interface Feedback {
  correct: boolean;
  correct_answer: string;
  explanation: string;
  mini_lesson: { name: string; text: string } | null;
  status: string;
  p_before: number;
  p_after: number;
  just_mastered: boolean;
}

/** Daily practice: one question at a time with feedback, mini-lessons and mastery progress. */
export function PracticeRunner({ answeredToday, goal, onExit }: { answeredToday: number; goal: number; onExit: () => void }) {
  const [current, setCurrent] = useState<Next | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [count, setCount] = useState(answeredToday);

  const loadNext = useCallback(async () => {
    setFeedback(null);
    setCurrent(null);
    setError(null);
    try {
      setCurrent(await questFetch<Next>("/api/quest/practice"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }, []);

  useEffect(() => { loadNext(); }, [loadNext]);

  const answer = async (response: string, seconds: number) => {
    if (!current) return;
    setIsSending(true);
    try {
      const fb = await questFetch<Feedback>("/api/quest/practice", {
        method: "POST",
        body: JSON.stringify({ item_id: current.question.id, response, phase: current.phase, seconds }),
      });
      setFeedback(fb);
      setCount((c) => c + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setIsSending(false);
    }
  };

  const goalReached = count >= goal;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Progress value={Math.min(100, (count / goal) * 100)} />
          <p className="mt-1 text-xs text-muted-foreground">
            {goalReached ? `Daily goal reached (${count} today). Keep going if you like!` : `${count} of ${goal} for today`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onExit}>Done for now</Button>
      </div>

      {error && (
        <Card><CardContent className="space-y-3 py-8 text-center">
          <p>{error}</p>
          <Button variant="outline" onClick={onExit}>Back</Button>
        </CardContent></Card>
      )}

      {!error && !current && <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}

      {current && (
        <Card>
          <CardHeader className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{current.question.skill_name}</Badge>
              <span className="text-xs text-muted-foreground">{current.reason}</span>
            </div>
            <CardTitle className="sr-only">Practice question</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!feedback ? (
              <QuestionCard question={current.question} onSubmit={answer} disabled={isSending} />
            ) : (
              <FeedbackPanel question={current.question} feedback={feedback} onNext={loadNext} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FeedbackPanel({ question, feedback, onNext }: { question: QuestQuestion; feedback: Feedback; onNext: () => void }) {
  const before = Math.round(feedback.p_before * 100);
  const after = Math.round(feedback.p_after * 100);
  return (
    <div className="space-y-4">
      <p className="text-lg whitespace-pre-wrap text-muted-foreground">{question.stem}</p>
      <div className={`flex items-start gap-3 rounded-lg p-4 ${feedback.correct ? "bg-green-500/10" : "bg-amber-500/10"}`}>
        {feedback.correct ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />}
        <div className="space-y-1 text-sm">
          <p className="font-semibold">{feedback.correct ? "Correct!" : `Not quite. The answer is ${feedback.correct_answer}.`}</p>
          <Markdown>{feedback.explanation}</Markdown>
        </div>
      </div>

      {feedback.mini_lesson && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
          <p className="mb-1 flex items-center gap-2 font-semibold"><Lightbulb className="h-4 w-4 text-primary" /> Quick tip: {feedback.mini_lesson.name}</p>
          <Markdown>{feedback.mini_lesson.text}</Markdown>
        </div>
      )}

      {feedback.just_mastered ? (
        <div className="flex items-center gap-3 rounded-lg bg-primary/10 p-4">
          <Trophy className="h-6 w-6 text-primary" />
          <p className="font-semibold">You mastered {question.skill_name}! It&apos;ll come back now and then so it sticks.</p>
        </div>
      ) : (
        <div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{question.skill_name}</span>
            <span>{after >= before ? `${before}% → ${after}%` : `${after}%`}</span>
          </div>
          <Progress value={after} />
        </div>
      )}

      <Button size="lg" onClick={onNext} autoFocus>Next question</Button>
    </div>
  );
}
