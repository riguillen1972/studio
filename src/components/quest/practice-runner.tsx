"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Markdown } from "@/components/markdown";
import { CheckCircle2, Lightbulb, Loader2, Trophy, XCircle } from "lucide-react";
import { QuestionCard, type QuestQuestion } from "./question-card";
import { questFetch } from "./quest-api";
import type { SkillSummary } from "./skill-list";

interface Next { question: QuestQuestion; phase: "practice" | "review"; reason: string }
interface Feedback {
  correct: boolean;
  correct_answer: string;
  explanation: string;
  mini_lesson: { name: string; text: string } | null;
  status: string;
  p_before: number;
  p_after: number;
  score_before: number;
  score_after: number;
  just_mastered: boolean;
}

type RunnerProps =
  | { skill?: undefined; answeredToday: number; goal: number; onExit: () => void }
  | { skill: SkillSummary; answeredToday?: undefined; goal?: undefined; onExit: () => void };

/**
 * One question at a time with feedback, mini-lessons and the skill score. Without `skill` it's the
 * daily mix picked by the engine; with `skill` it practices that one skill the student chose.
 */
export function PracticeRunner({ skill, answeredToday = 0, goal = 0, onExit }: RunnerProps) {
  const [current, setCurrent] = useState<Next | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [count, setCount] = useState(answeredToday);
  const [score, setScore] = useState(skill?.score ?? 0);
  const lastItem = useRef<string | null>(null);

  const loadNext = useCallback(async () => {
    setFeedback(null);
    setCurrent(null);
    setError(null);
    try {
      const path = skill
        ? `/api/quest/practice?skill=${encodeURIComponent(skill.id)}${lastItem.current ? `&last=${encodeURIComponent(lastItem.current)}` : ""}`
        : "/api/quest/practice";
      setCurrent(await questFetch<Next>(path));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }, [skill]);

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
      setScore(fb.score_after);
      lastItem.current = current.question.id;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setIsSending(false);
    }
  };

  const goalReached = count >= goal;

  return (
    <div className="space-y-4">
      {skill ? (
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">{skill.code} · {skill.section <= 5 ? "Foundations" : `Grade ${skill.section}`}</p>
            <p className="font-semibold">{skill.name}{skill.advanced && <span className="ml-1 text-amber-500">★</span>}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Score</p>
            <p className="text-2xl font-bold tabular-nums">{score}</p>
          </div>
          <Button variant="outline" size="sm" onClick={onExit}>Back to skills</Button>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Progress value={Math.min(100, (count / goal) * 100)} />
            <p className="mt-1 text-xs text-muted-foreground">
              {goalReached ? `Daily goal reached (${count} today). Keep going if you like!` : `${count} of ${goal} for today`}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onExit}>Done for now</Button>
        </div>
      )}

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
            {!skill && (
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{current.question.skill_name}</Badge>
                <span className="text-xs text-muted-foreground">{current.reason}</span>
              </div>
            )}
            <CardTitle className="sr-only">Practice question</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!feedback ? (
              <QuestionCard question={current.question} onSubmit={answer} disabled={isSending} />
            ) : (
              <FeedbackPanel question={current.question} feedback={feedback} onNext={loadNext} onExit={skill && feedback.just_mastered ? onExit : undefined} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FeedbackPanel({ question, feedback, onNext, onExit }: {
  question: QuestQuestion; feedback: Feedback; onNext: () => void; onExit?: () => void;
}) {
  const before = feedback.score_before;
  const after = feedback.score_after;
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
            <span className="tabular-nums">Score {before} → {after}</span>
          </div>
          <Progress value={after} />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {onExit && <Button size="lg" onClick={onExit} autoFocus>Pick another skill</Button>}
        <Button size="lg" variant={onExit ? "outline" : "default"} onClick={onNext} autoFocus={!onExit}>
          {onExit ? "Keep practicing" : "Next question"}
        </Button>
      </div>
    </div>
  );
}
