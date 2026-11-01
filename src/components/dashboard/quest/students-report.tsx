"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle2, Download, FileText, Flame, Loader2, Printer, XCircle } from "lucide-react";
import { questFetch } from "@/components/quest/quest-api";
import { downloadCsv, fileSlug } from "@/lib/csv";
import { openWorksheet } from "./question-bank";
import { BandLegend, bandInfo } from "./band";
import { PlacementLadder, PlacementSummary } from "@/components/quest/placement-card";
import type { StudentReport } from "@/lib/quest/engine";
import type { QuestClassData } from "./quest-teacher";

interface ReportsResponse { class_name: string; teacher_name: string | null; reports: StudentReport[] }

const tz = () => new Date().getTimezoneOffset();
export const openParentReport = (classId: string, studentId?: string) =>
  window.open(`/print/parent-report?class_id=${classId}${studentId ? `&student=${studentId}` : ""}&tz=${tz()}`, "_blank");

/** Student list on the left, one student's full report on the right. */
export function StudentsReport({ data }: { data: QuestClassData }) {
  const { toast } = useToast();
  const [selected, setSelected] = useState<string | null>(data.students[0]?.id ?? null);
  const [report, setReport] = useState<StudentReport | null>(null);
  const [exporting, setExporting] = useState(false);
  const row = (sid: string) => data.report.find((r) => r.student_id === sid);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    setReport(null);
    questFetch<ReportsResponse>(`/api/quest/class/${data.class.id}/reports?student=${selected}&tz=${tz()}`)
      .then((r) => { if (!cancelled) setReport(r.reports[0] ?? null); })
      .catch((e) => toast({ title: "Couldn't load the report", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" }));
    return () => { cancelled = true; };
  }, [selected, data.class.id, toast]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const { reports } = await questFetch<ReportsResponse>(`/api/quest/class/${data.class.id}/reports?tz=${tz()}`);
      downloadCsv(`${fileSlug(data.class.name)}-students.csv`, [
        ["Student", "Grade", "Questions (30 days)", "Accuracy % (30 days)", "Minutes (30 days)", "Skills mastered", "Day streak",
          "Diagnostic done", "Weak spots from diagnostic", "Strengths", "Focus areas", "Repeated mistakes"],
        ...reports.map((r) => [
          r.student.name, r.student.grade, r.totals.questions_30d, r.totals.accuracy_30d ?? "", r.totals.minutes_30d, r.totals.mastered, r.totals.streak,
          r.diagnostic ? "yes" : "no", r.diagnostic?.gaps.join("; ") ?? "",
          r.strengths.map((t) => `${t.title} (${t.score})`).join("; "), r.focus.map((t) => `${t.title} (${t.score})`).join("; "),
          r.mistakes.map((m) => `${m.name} ×${m.count}`).join("; "),
        ]),
      ]);
    } catch (e) {
      toast({ title: "Couldn't export", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  if (!data.students.length) return <p className="text-sm text-muted-foreground">No grade 6–8 students in this class yet.</p>;

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <Card className="h-fit print:hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Students</CardTitle>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={exportCsv} disabled={exporting}>
              {exporting ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-1 h-3.5 w-3.5" />} CSV
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openParentReport(data.class.id)}>
              <FileText className="mr-1 h-3.5 w-3.5" /> All parent summaries
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-2">
          <ul className="max-h-[70vh] overflow-y-auto">
            {data.students.map((s) => {
              const r = row(s.id);
              return (
                <li key={s.id}>
                  <button onClick={() => setSelected(s.id)}
                    className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted ${selected === s.id ? "bg-muted font-medium" : ""}`}>
                    <span className="truncate">{s.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">Gr {s.grade}{r ? ` · ${r.practice_questions}q` : ""}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {!report ? (
        <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : (
        <StudentDetail report={report} classId={data.class.id} />
      )}
    </div>
  );
}

function StudentDetail({ report: r, classId }: { report: StudentReport; classId: string }) {
  const focusSkillIds = r.skills.filter((s) => !s.mastered && s.score < 70).sort((a, b) => a.score - b.score).slice(0, 6).map((s) => s.id);
  const grade = r.student.grade;
  const gradeTopics = r.topics.filter((t) => t.section === grade);
  const otherTopics = r.topics.filter((t) => t.section !== grade);
  const latestPlacement = r.placements.at(-1) ?? null;
  const firstPlacement = r.placements.length > 1 ? r.placements[0] : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{r.student.name}</h3>
          <p className="text-sm text-muted-foreground">
            {grade ? `Grade ${grade} · ` : ""}
            {r.diagnostic ? `Diagnostic taken ${new Date(r.diagnostic.completed_at!).toLocaleDateString()}` : "No diagnostic yet"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          {focusSkillIds.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => openWorksheet(focusSkillIds, `Practice for ${r.student.name}`)}>
              <Printer className="mr-2 h-4 w-4" /> Worksheet on weak skills
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => openParentReport(classId, r.student.id)}>
            <FileText className="mr-2 h-4 w-4" /> Parent summary
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat value={r.totals.questions_30d} label="questions (30 days)" />
        <Stat value={r.totals.accuracy_30d === null ? "—" : `${r.totals.accuracy_30d}%`} label="correct (30 days)" />
        <Stat value={r.totals.minutes_30d} label="minutes (30 days)" />
        <Stat value={r.totals.mastered} label="skills mastered" />
        <Stat value={<span className="flex items-center gap-1"><Flame className={`h-5 w-5 ${r.totals.streak ? "text-orange-500" : "text-muted-foreground"}`} />{r.totals.streak}</span>} label="day streak" />
      </div>

      {latestPlacement?.overall != null && grade && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Placement</CardTitle>
            <CardDescription>
              {r.placements.length > 1
                ? `Latest check-in (${new Date(latestPlacement.completed_at).toLocaleDateString()}) compared with the first diagnostic`
                : "From the diagnostic"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PlacementSummary placement={latestPlacement} grade={grade} previous={firstPlacement} />
            <PlacementLadder placement={latestPlacement} grade={grade} previous={firstPlacement} forTeacher />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Last 14 days</CardTitle>
          <CardDescription>Practice questions per day</CardDescription>
        </CardHeader>
        <CardContent><ActivityChart days={r.activity} /></CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Strengths</CardTitle></CardHeader>
          <CardContent>
            {r.strengths.length ? (
              <ul className="space-y-1.5 text-sm">{r.strengths.map((t) => (
                <li key={`${t.section}${t.letter}`} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <span>{t.title} <span className="text-muted-foreground">({t.score})</span></span></li>
              ))}</ul>
            ) : <p className="text-sm text-muted-foreground">No topic at 80 or above yet.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Focus areas</CardTitle></CardHeader>
          <CardContent>
            {r.focus.length ? (
              <ul className="space-y-1.5 text-sm">{r.focus.map((t) => (
                <li key={`${t.section}${t.letter}`} className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <span>{t.title} <span className="text-muted-foreground">({t.score})</span></span></li>
              ))}</ul>
            ) : <p className="text-sm text-muted-foreground">No topic below 70. Nice work.</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Scores by topic</CardTitle>
            <BandLegend />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {r.topics.length === 0 && <p className="text-sm text-muted-foreground">No scores yet. They appear after the diagnostic or some practice.</p>}
          {[{ label: grade ? `Grade ${grade}` : "Grade level", topics: gradeTopics }, { label: "Other grades and foundations", topics: otherTopics }]
            .filter((g) => g.topics.length).map((g) => (
              <div key={g.label} className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{g.label}</p>
                {g.topics.map((t) => {
                  const b = bandInfo(t.score);
                  return (
                    <div key={`${t.section}${t.letter}`} className="grid grid-cols-[minmax(0,1fr)_120px_36px] items-center gap-3 text-sm"
                      title={`${t.core_mastered} of ${t.core_total} core skills mastered`}>
                      <span className="truncate">{t.section <= 5 ? "" : `${t.section}.${t.letter} `}{t.title}</span>
                      <span className="h-2 overflow-hidden rounded-full bg-muted"><span className={`block h-full rounded-full ${b.bar}`} style={{ width: `${t.score}%` }} /></span>
                      <span className={`text-right font-medium tabular-nums ${b.text}`}>{t.score}</span>
                    </div>
                  );
                })}
              </div>
            ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Repeated mistakes</CardTitle>
            <CardDescription>Patterns in wrong answers (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            {r.mistakes.length ? (
              <ul className="space-y-1.5 text-sm">{r.mistakes.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-2"><span>{m.name}</span><Badge variant="secondary">×{m.count}</Badge></li>
              ))}</ul>
            ) : <p className="text-sm text-muted-foreground">No repeated mistake patterns.</p>}
            {r.diagnostic && r.diagnostic.gaps.length > 0 && (
              <p className="mt-3 text-xs text-muted-foreground"><span className="font-medium">Diagnostic weak spots:</span> {r.diagnostic.gaps.join(", ")}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Recent work</CardTitle></CardHeader>
          <CardContent>
            {r.recent.length ? (
              <ul className="space-y-1 text-sm">{r.recent.map((a, i) => (
                <li key={i} className="flex items-center gap-2">
                  {a.correct ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" aria-label="Correct" /> : <XCircle className="h-4 w-4 shrink-0 text-red-500" aria-label="Wrong" />}
                  <span className="truncate">{a.skill}</span>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">{new Date(a.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                </li>
              ))}</ul>
            ) : <p className="text-sm text-muted-foreground">No practice in the last 30 days.</p>}
          </CardContent>
        </Card>
      </div>

      {r.badges.length > 0 && (
        <p className="text-sm"><span className="font-medium">Badges:</span> <span className="text-muted-foreground">{r.badges.join(", ")}</span></p>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-md bg-muted/50 p-3">
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/** Daily practice bars; hover a day for questions, accuracy and minutes. */
function ActivityChart({ days }: { days: StudentReport["activity"] }) {
  const max = Math.max(5, ...days.map((d) => d.questions));
  const label = (date: string) => new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
  return (
    <div>
      <div className="flex h-28 items-end gap-0.5 border-b">
        {days.map((d) => (
          <div key={d.date} className="group relative flex h-full flex-1 items-end justify-center"
            title={`${label(d.date)}: ${d.questions} questions${d.questions ? `, ${Math.round((d.correct / d.questions) * 100)}% correct, ${d.minutes} min` : ""}`}>
            {d.questions > 0 && (
              <div className="w-full max-w-6 rounded-t bg-sky-500 group-hover:bg-sky-600" style={{ height: `${(d.questions / max) * 100}%` }} />
            )}
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-0.5">
        {days.map((d, i) => (
          <span key={d.date} className="flex-1 text-center text-[10px] text-muted-foreground">{i % 2 === 1 || days.length <= 7 ? label(d.date) : ""}</span>
        ))}
      </div>
    </div>
  );
}
