"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { QuestionCard, type QuestQuestion } from "./question-card";
import { questFetch } from "./quest-api";

interface Progress {
  assessment_id: string;
  kind: "diagnostic" | "post";
  status: "in_progress" | "completed";
  question: QuestQuestion | null;
  answered: number;
  total_estimate: number;
  results?: Record<string, unknown>;
}

/** Runs the diagnostic or the post-check. No right/wrong feedback during, so it measures fairly. */
export function AssessmentRunner({ kind, onDone }: { kind: "diagnostic" | "post"; onDone: () => void }) {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    questFetch<Progress>("/api/quest/assessment", { method: "POST", body: JSON.stringify({ action: "start", kind }) })
      .then(setProgress)
      .catch((e) => setError(e.message));
  }, [kind]);

  const answer = async (response: string, seconds: number) => {
    if (!progress?.question) return;
    setIsSending(true);
    try {
      const next = await questFetch<Progress>("/api/quest/assessment", {
        method: "POST",
        body: JSON.stringify({ action: "answer", assessment_id: progress.assessment_id, item_id: progress.question.id, response, seconds }),
      });
      setProgress(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setIsSending(false);
    }
  };

  const title = kind === "diagnostic" ? "Finding your starting point" : "End-of-week check";

  if (error) {
    return (
      <Card><CardContent className="space-y-3 py-8 text-center">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={onDone}>Back</Button>
      </CardContent></Card>
    );
  }
  if (!progress) return <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  if (progress.status === "completed") {
    return <AssessmentDone kind={kind} results={progress.results ?? {}} onDone={onDone} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {kind === "diagnostic"
            ? "Do your best. It's not graded. It helps Study Buddy know what to practice with you. Skip nothing; if you're unsure, make your best guess."
            : "Show what you've learned this week. It's not graded."}
        </CardDescription>
        <div className="pt-2">
          <Progress value={(progress.answered / Math.max(1, progress.total_estimate)) * 100} />
          <p className="mt-1 text-xs text-muted-foreground">Question {progress.answered + 1} of about {progress.total_estimate}</p>
        </div>
      </CardHeader>
      <CardContent>
        {progress.question && <QuestionCard question={progress.question} onSubmit={answer} disabled={isSending} submitLabel="Next" />}
      </CardContent>
    </Card>
  );
}

function AssessmentDone({ kind, results, onDone }: { kind: "diagnostic" | "post"; results: Record<string, unknown>; onDone: () => void }) {
  if (kind === "diagnostic") {
    const skills = (results.skills as { name: string; result: string; grade: number }[] | undefined) ?? [];
    const strong = skills.filter((s) => s.result === "correct").map((s) => s.name);
    const focus = skills.filter((s) => s.result === "wrong").map((s) => s.name);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Done! Here&apos;s your starting point</CardTitle>
          <CardDescription>Everyone has things to work on. Your practice will focus on these first.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {strong.length > 0 && (
            <div>
              <p className="font-medium text-green-700 dark:text-green-400">You&apos;re strong in</p>
              <ul className="list-disc pl-5 text-sm">{strong.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
          )}
          {focus.length > 0 && (
            <div>
              <p className="font-medium">We&apos;ll practice</p>
              <ul className="list-disc pl-5 text-sm">{focus.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
          )}
          <Button onClick={onDone}>Start practicing</Button>
        </CardContent>
      </Card>
    );
  }

  const pre = results.pre_average as number | null;
  const post = results.post_average_same_skills as number | null;
  const pct = (x: number | null | undefined) => (x === null || x === undefined ? "—" : `${Math.round(x * 100)}%`);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Week complete!</CardTitle>
        <CardDescription>Here&apos;s how you did on the skills you practiced.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pre !== null && post !== null && (
          <div className="flex gap-8 text-center">
            <div><p className="text-3xl font-bold">{pct(pre)}</p><p className="text-xs text-muted-foreground">Monday</p></div>
            <div><p className="text-3xl font-bold text-green-600">{pct(post)}</p><p className="text-xs text-muted-foreground">Today</p></div>
          </div>
        )}
        <Button onClick={onDone}>Back to Math Quest</Button>
      </CardContent>
    </Card>
  );
}
