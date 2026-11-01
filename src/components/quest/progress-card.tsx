"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Award, Blocks, CheckCircle2, Compass, Flame, Footprints, Hash, Heart, Medal, Milestone, Route, Star, Trophy, Users,
  type LucideIcon,
} from "lucide-react";

export interface QuestBadge { id: string; name: string; description: string; icon: string; earned?: boolean; kind?: "milestone" | "topic" }
export interface QuestProgress { streak: number; answered: number; badges: QuestBadge[]; week_questions: number; week_mastered: number }

const ICONS: Record<string, LucideIcon> = {
  footprints: Footprints, hundred: Hash, route: Route, flame: Flame, heart: Heart, check: CheckCircle2, blocks: Blocks,
  trophy: Trophy, compass: Compass, bridge: Milestone, star: Star, medal: Medal,
};

export function BadgeIcon({ icon, earned = true, size = "md" }: { icon: string; earned?: boolean; size?: "md" | "lg" }) {
  const Icon = ICONS[icon] ?? Award;
  const box = size === "lg" ? "h-14 w-14" : "h-10 w-10";
  const glyph = size === "lg" ? "h-7 w-7" : "h-5 w-5";
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full ${box} ${earned ? "bg-amber-400/20 text-amber-600 ring-2 ring-amber-400/60 dark:text-amber-400" : "bg-muted text-muted-foreground/50"}`}>
      <Icon className={glyph} />
    </span>
  );
}

/** Streak, this week's work, the class goal, and the badge collection. */
export function ProgressCard({ progress, classGoal, onCertificate }: {
  progress: QuestProgress;
  classGoal: { goal: number; done: number } | null;
  onCertificate: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const earned = progress.badges.filter((b) => b.earned);
  const milestones = progress.badges.filter((b) => b.kind === "milestone");
  const topics = progress.badges.filter((b) => b.kind === "topic");
  const shown = showAll ? [...milestones, ...topics] : milestones;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Your progress</CardTitle>
        <CardDescription>Practice 5 questions a day to keep your streak. Weekends never break it.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={<Flame className={`h-5 w-5 ${progress.streak ? "text-orange-500" : "text-muted-foreground"}`} />}
            value={progress.streak} label="day streak" />
          <Stat icon={<Hash className="h-5 w-5 text-sky-500" />} value={progress.week_questions} label="questions this week" />
          <Stat icon={<CheckCircle2 className="h-5 w-5 text-green-600" />} value={progress.week_mastered} label="mastered this week" />
          <Stat icon={<Award className="h-5 w-5 text-amber-500" />} value={earned.length} label="badges earned" />
        </div>

        {classGoal && (
          <div className="space-y-1 rounded-md border p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-medium"><Users className="h-4 w-4 text-primary" /> Class goal this week</span>
              <span className="tabular-nums text-muted-foreground">{classGoal.done} / {classGoal.goal} questions</span>
            </div>
            <Progress value={Math.min(100, (classGoal.done / classGoal.goal) * 100)} />
            <p className="text-xs text-muted-foreground">
              {classGoal.done >= classGoal.goal ? "Your class reached the goal. Well done, everyone!" : "Every question you answer helps your whole class."}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Badges</p>
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Show fewer" : `Show topic badges (${topics.filter((t) => t.earned).length}/${topics.length})`}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {shown.map((b) => (
              <div key={b.id} className={`flex items-center gap-2 rounded-md border p-2 ${b.earned ? "" : "opacity-70"}`} title={b.description}>
                <BadgeIcon icon={b.icon} earned={b.earned} />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{b.name}</p>
                  <p className="line-clamp-2 text-[11px] leading-tight text-muted-foreground">{b.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {progress.week_questions > 0 && (
          <Button variant="outline" size="sm" onClick={onCertificate}><Award className="mr-2 h-4 w-4" /> Print my certificate for this week</Button>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="rounded-md bg-muted/50 p-3">
      <div className="flex items-center gap-2">{icon}<span className="text-2xl font-bold tabular-nums">{value}</span></div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
