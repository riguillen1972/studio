"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, ClipboardList, Radio, School, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { questFetch } from "@/components/quest/quest-api";
import { cleanAssignments } from "@/lib/textbook-assign";

interface ClassRow { id: string; enrollment_count?: number; settings?: { assigned_lessons?: unknown } }
interface SessionUsage { used: number; included: number; extra: number; remaining: number }

/**
 * A teacher's month at a glance, in place of the students' AI token meter: live sessions with the
 * AI Teacher (the part of the plan that's limited), plus their classes, students and assigned lessons.
 */
export function TeacherMonth({ hasTeacherMax }: { hasTeacherMax: boolean }) {
  const [classes, setClasses] = useState<ClassRow[] | null>(null);
  const [sessions, setSessions] = useState<SessionUsage | null>(null);

  useEffect(() => {
    questFetch<{ data?: ClassRow[] }>("/api/classes").then((r) => setClasses(r.data ?? [])).catch(() => setClasses([]));
    if (hasTeacherMax) questFetch<{ usage: SessionUsage }>("/api/sessions").then((r) => setSessions(r.usage)).catch(() => {});
  }, [hasTeacherMax]);

  const students = (classes ?? []).reduce((n, c) => n + (c.enrollment_count ?? 0), 0);
  const assigned = (classes ?? []).reduce((n, c) => n + (cleanAssignments(c.settings?.assigned_lessons)?.length ?? 0), 0);
  const allowed = sessions ? sessions.included + sessions.extra : 0;
  const stats = [
    { icon: School, label: "Classes", value: classes?.length },
    { icon: Users, label: "Students", value: classes ? students : undefined },
    { icon: ClipboardList, label: "Lessons assigned", value: classes ? assigned : undefined },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2"><CalendarCheck className="text-primary" /> This Month</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <p className="flex items-center gap-2 text-sm font-medium"><Radio className="h-4 w-4 text-primary" /> Live Sessions with your AI Teacher</p>
          {!hasTeacherMax ? (
            <p className="text-sm text-muted-foreground">Teacher Max includes 20 live sessions a month. <Link href="#plans" className="font-medium text-primary hover:underline">See plans</Link></p>
          ) : sessions ? (
            <>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Used</span>
                <span className="tabular-nums">{sessions.used} / {allowed}</span>
              </div>
              <Progress value={allowed > 0 ? Math.min(100, (sessions.used / allowed) * 100) : 0} />
            </>
          ) : <p className="text-sm text-muted-foreground">Loading…</p>}
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg bg-muted/50 p-3">
              <s.icon className="mx-auto mb-1 h-4 w-4 text-primary" />
              <p className="text-xl font-bold tabular-nums">{s.value ?? "–"}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-center text-muted-foreground">Live sessions reset on the 1st of each month.</p>
      </CardContent>
    </Card>
  );
}
