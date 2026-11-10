"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AssessmentRunner } from "@/components/quest/assessment-runner";
import { PracticeRunner } from "@/components/quest/practice-runner";
import { questFetch } from "@/components/quest/quest-api";
import { SkillList, type SkillSummary } from "@/components/quest/skill-list";
import { ProgressCard, type QuestProgress } from "@/components/quest/progress-card";
import { ClipboardCheck, Compass, Loader2, Mountain, Play, Target } from "lucide-react";
import { PlacementLadder, PlacementSummary } from "@/components/quest/placement-card";
import type { Placement } from "@/lib/quest/placement";
import { MotionConfig } from "framer-motion";
import { AnimatedBar, Stagger } from "@/components/quest/quest-motion";

interface Overview {
  eligible: boolean;
  grade?: number;
  diagnostic: { status: string; results: unknown; placement: Placement | null; first_placement: Placement | null } | null;
  checkin: { in_progress: boolean } | null;
  post: { status: string; results: unknown } | null;
  post_check_open: boolean;
  progress: QuestProgress;
  class_goal: { goal: number; done: number } | null;
  today: { answered: number; correct: number; minutes: number; goal: number };
  skills: SkillSummary[];
}

type Mode = "home" | "diagnostic" | "practice" | "post" | "skill";

export default function QuestPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [mode, setMode] = useState<Mode>("home");
  const [skill, setSkill] = useState<SkillSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setOverview(await questFetch<Overview>(`/api/quest/me?tz=${new Date().getTimezoneOffset()}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load Math Quest.");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const backHome = () => { setMode("home"); load(); };

  return (
    <MotionConfig reducedMotion="user">
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold font-headline tracking-tight sm:text-3xl">
          <Compass className="h-7 w-7 text-primary" /> Math Quest
        </h1>
        <p className="mt-1 text-muted-foreground">Practice that adapts to you, covering all of grades 6–8 math: numbers, ratios, equations, functions, geometry and data.</p>
      </header>

      {error && <p className="text-destructive">{error}</p>}
      {!overview && !error && <Loader2 className="h-6 w-6 animate-spin" />}

      {overview && !overview.eligible && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Math Quest is for students in grades 6–8.</CardContent></Card>
      )}

      {overview?.eligible && mode === "diagnostic" && <AssessmentRunner kind="diagnostic" grade={overview.grade ?? 6} onDone={backHome} />}
      {overview?.eligible && mode === "post" && <AssessmentRunner kind="post" grade={overview.grade ?? 6} onDone={backHome} />}
      {overview?.eligible && mode === "practice" && (
        <PracticeRunner answeredToday={overview.today.answered} goal={overview.today.goal} onExit={backHome} />
      )}

      {overview?.eligible && mode === "skill" && skill && <PracticeRunner skill={skill} onExit={backHome} />}

      {overview?.eligible && mode === "home" && (
        <Home overview={overview} onStart={setMode} onPickSkill={(s) => { setSkill(s); setMode("skill"); }} />
      )}
    </div>
    </MotionConfig>
  );
}

function Home({ overview, onStart, onPickSkill }: { overview: Overview; onStart: (mode: Mode) => void; onPickSkill: (skill: SkillSummary) => void }) {
  const diagnosticDone = overview.diagnostic?.status === "completed";
  const postDone = overview.post?.status === "completed";

  const skillList = <SkillList skills={overview.skills} grade={overview.grade ?? 6} onPick={onPickSkill} />;

  if (!diagnosticDone) {
    return (
      <Stagger className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Find your starting point</CardTitle>
            <CardDescription>
              About 30 questions, around 25 minutes. It isn&apos;t graded. It helps Study Buddy find what you already know and
              what to practice. Have scratch paper ready.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" onClick={() => onStart("diagnostic")}>
              <Play className="mr-2 h-4 w-4" /> {overview.diagnostic?.status === "in_progress" ? "Continue" : "Start"}
            </Button>
          </CardContent>
        </Card>
        {skillList}
      </Stagger>
    );
  }

  const mastered = overview.skills.filter((s) => s.status === "mastered").length;

  return (
    <Stagger className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s practice</CardTitle>
          <CardDescription>About 15 questions picked for you: this week&apos;s topic, your weak spots, and a little review.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <AnimatedBar to={(overview.today.answered / overview.today.goal) * 100} />
            <p className="mt-1 text-xs text-muted-foreground">
              {overview.today.answered} of {overview.today.goal} today · {overview.today.minutes} min · {mastered} skills mastered
            </p>
          </div>
          <Button size="lg" onClick={() => onStart("practice")}>
            <Play className="mr-2 h-4 w-4" /> {overview.today.answered > 0 ? "Keep practicing" : "Start practice"}
          </Button>
        </CardContent>
      </Card>

      {overview.checkin && (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Mountain className="h-5 w-5 text-primary" /> Check-in time</CardTitle>
            <CardDescription>
              Your teacher opened a check-in. It&apos;s like your first starting-point check (about 30 questions), so you can see how much
              you&apos;ve grown. Your practice progress is kept.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => onStart("diagnostic")}>{overview.checkin.in_progress ? "Continue" : "Start the check-in"}</Button>
          </CardContent>
        </Card>
      )}

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

      <ProgressCard progress={overview.progress} classGoal={overview.class_goal}
        onCertificate={() => window.open(`/print/certificate?tz=${new Date().getTimezoneOffset()}`, "_blank")} />

      {overview.diagnostic?.placement?.overall != null && (
        <Card>
          <CardHeader>
            <CardTitle>Where you are</CardTitle>
            <CardDescription>
              {overview.diagnostic.first_placement ? "From your latest check-in, compared with your first check." : "From your starting-point check."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PlacementSummary placement={overview.diagnostic.placement} grade={overview.grade ?? 6} previous={overview.diagnostic.first_placement} />
            <PlacementLadder placement={overview.diagnostic.placement} grade={overview.grade ?? 6} previous={overview.diagnostic.first_placement} />
          </CardContent>
        </Card>
      )}

      {skillList}
    </Stagger>
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
