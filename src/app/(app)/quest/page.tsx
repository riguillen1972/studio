"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AssessmentRunner } from "@/components/quest/assessment-runner";
import { PracticeRunner } from "@/components/quest/practice-runner";
import { questFetch } from "@/components/quest/quest-api";
import { ClipboardCheck, Compass, Loader2, Play, Target } from "lucide-react";

interface SkillSummary { id: string; name: string; grade: number; status: string; p_known: number | null }
interface Overview {
  eligible: boolean;
  grade?: number;
  diagnostic: { status: string; results: unknown } | null;
  post: { status: string; results: unknown } | null;
  post_check_open: boolean;
  today: { answered: number; correct: number; minutes: number; goal: number };
  skills: SkillSummary[];
}

type Mode = "home" | "diagnostic" | "practice" | "post";

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  mastered: { label: "Mastered", className: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30" },
  developing: { label: "Getting there", className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30" },
  gap: { label: "Practice this", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  not_started: { label: "Not started", className: "bg-muted text-muted-foreground border-border" },
};

export default function QuestPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [mode, setMode] = useState<Mode>("home");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setOverview(await questFetch<Overview>("/api/quest/me"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load Math Quest.");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const backHome = () => { setMode("home"); load(); };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold font-headline tracking-tight sm:text-3xl">
          <Compass className="h-7 w-7 text-primary" /> Math Quest
        </h1>
        <p className="mt-1 text-muted-foreground">Practice that adapts to you: fractions, ratios and proportions, and equations.</p>
      </header>

      {error && <p className="text-destructive">{error}</p>}
      {!overview && !error && <Loader2 className="h-6 w-6 animate-spin" />}

      {overview && !overview.eligible && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Math Quest is for students in grades 6–8.</CardContent></Card>
      )}

      {overview?.eligible && mode === "diagnostic" && <AssessmentRunner kind="diagnostic" onDone={backHome} />}
      {overview?.eligible && mode === "post" && <AssessmentRunner kind="post" onDone={backHome} />}
      {overview?.eligible && mode === "practice" && (
        <PracticeRunner answeredToday={overview.today.answered} goal={overview.today.goal} onExit={backHome} />
      )}

      {overview?.eligible && mode === "home" && <Home overview={overview} onStart={setMode} />}
    </div>
  );
}

function Home({ overview, onStart }: { overview: Overview; onStart: (mode: Mode) => void }) {
  const diagnosticDone = overview.diagnostic?.status === "completed";
  const postDone = overview.post?.status === "completed";

  if (!diagnosticDone) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Find your starting point</CardTitle>
          <CardDescription>
            About 20 questions, around 20 minutes. It isn&apos;t graded. It helps Study Buddy find what you already know and
            what to practice. Have scratch paper ready.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="lg" onClick={() => onStart("diagnostic")}>
            <Play className="mr-2 h-4 w-4" /> {overview.diagnostic?.status === "in_progress" ? "Continue" : "Start"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const byGrade = [...new Set(overview.skills.map((s) => s.grade))].sort();
  const mastered = overview.skills.filter((s) => s.status === "mastered").length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s practice</CardTitle>
          <CardDescription>About 15 questions picked for you: this week&apos;s topic, your weak spots, and a little review.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Progress value={Math.min(100, (overview.today.answered / overview.today.goal) * 100)} />
            <p className="mt-1 text-xs text-muted-foreground">
              {overview.today.answered} of {overview.today.goal} today · {overview.today.minutes} min · {mastered} skills mastered
            </p>
          </div>
          <Button size="lg" onClick={() => onStart("practice")}>
            <Play className="mr-2 h-4 w-4" /> {overview.today.answered > 0 ? "Keep practicing" : "Start practice"}
          </Button>
        </CardContent>
      </Card>

      {overview.post_check_open && !postDone && (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-primary" /> End-of-week check</CardTitle>
            <CardDescription>Your teacher opened a short check on the skills you practiced (about 15 questions).</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => onStart("post")}>{overview.post?.status === "in_progress" ? "Continue" : "Start the check"}</Button>
          </CardContent>
        </Card>
      )}

      {postDone && <StudentSurvey />}

      <Card>
        <CardHeader>
          <CardTitle>Your skill map</CardTitle>
          <CardDescription>Skills turn green as you master them. Mastered skills come back now and then so they stick.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {byGrade.map((g) => (
            <div key={g}>
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{g <= 5 ? "Foundations" : `Grade ${g}`}</p>
              <div className="flex flex-wrap gap-2">
                {overview.skills.filter((s) => s.grade === g).map((s) => {
                  const style = STATUS_STYLE[s.status] ?? STATUS_STYLE.not_started;
                  return (
                    <span key={s.id} title={style.label} className={`rounded-full border px-3 py-1 text-xs ${style.className}`}>
                      {s.name}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-3 pt-2 text-xs text-muted-foreground">
            {Object.values(STATUS_STYLE).map((s) => (
              <span key={s.label} className={`rounded-full border px-2 py-0.5 ${s.className}`}>{s.label}</span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StudentSurvey() {
  const { toast } = useToast();
  const [helpful, setHelpful] = useState<number | null>(null);
  const [enjoyed, setEnjoyed] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async () => {
    try {
      await questFetch("/api/quest/feedback", {
        method: "POST",
        body: JSON.stringify({ kind: "student_survey", rating: helpful, answer: enjoyed ? String(enjoyed) : null, comment }),
      });
      setSent(true);
    } catch (e) {
      toast({ title: "Couldn't send", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
    }
  };

  if (sent) return <Card><CardContent className="py-6 text-center text-sm">Thanks for your feedback!</CardContent></Card>;

  const Scale = ({ value, onChange }: { value: number | null; onChange: (n: number) => void }) => (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <Button key={n} type="button" size="sm" variant={value === n ? "default" : "outline"} onClick={() => onChange(n)}>{n}</Button>
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick question (1 minute)</CardTitle>
        <CardDescription>Your honest answer helps make Math Quest better.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-1"><p>How much did Math Quest help you this week? (1 = not at all, 5 = a lot)</p><Scale value={helpful} onChange={setHelpful} /></div>
        <div className="space-y-1"><p>How much did you enjoy using it? (1 = not at all, 5 = a lot)</p><Scale value={enjoyed} onChange={setEnjoyed} /></div>
        <Textarea rows={2} maxLength={1000} placeholder="Anything you'd change? (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
        <Button onClick={submit} disabled={!helpful || !enjoyed}>Send</Button>
      </CardContent>
    </Card>
  );
}
