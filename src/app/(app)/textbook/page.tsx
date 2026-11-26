"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarDays, CheckCircle2, ChevronDown, ClipboardList, Eye, Library, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAppState } from "@/components/app-state-provider";
import { questFetch } from "@/components/quest/quest-api";
import { MentorAvatar } from "@/components/mentor/mentor-avatar";
import { useMentorChoice } from "@/hooks/use-mentor";
import { SKILLS_BY_ID } from "@/lib/quest/skills";
import { lessonPlace, textbookUnits } from "@/lib/textbook";
import { dueLabel, isOverdue, type AssignedLesson } from "@/lib/textbook-assign";

const GRADES = [6, 7, 8];
const CHAPTER_COLORS = ["bg-orange-600", "bg-sky-600", "bg-rose-600", "bg-teal-600", "bg-amber-700", "bg-green-600", "bg-violet-600", "bg-blue-600", "bg-pink-600", "bg-emerald-700", "bg-indigo-600", "bg-cyan-700", "bg-fuchsia-700"];

/** "2.3 Divide multi-digit numbers" */
const lessonName = (id: string) => {
  const p = lessonPlace(id);
  return `${p ? `${p.chapter.number}.${p.lessonInChapter} ` : ""}${SKILLS_BY_ID[id]?.name ?? id}`;
};

function DueChip({ due }: { due: string | null }) {
  const label = dueLabel(due);
  if (!label) return null;
  return <span className={`inline-flex items-center gap-1 text-xs ${isOverdue(due) ? "font-semibold text-destructive" : "text-muted-foreground"}`}><CalendarDays className="h-3 w-3" />{label}</span>;
}

interface TeacherClass { id: string; name: string; enrollment_count?: number }
interface DoneSummary { count: number; average: number }
interface StudentLessonResult {
  student_id: string;
  name: string;
  skill_id: string;
  score: number;
  best_score: number;
  attempts: number;
  completed_at: string;
}

/** The teacher's side: choose a class, assign lessons (with an optional due date), see who opened and finished them. */
function useTeacherAssignments(enabled: boolean) {
  const { toast } = useToast();
  const [classes, setClasses] = useState<TeacherClass[] | null>(null);
  const [classId, setClassId] = useState<string | null>(null);
  const [assigned, setAssigned] = useState<AssignedLesson[]>([]);
  const [opened, setOpened] = useState<Record<string, number>>({});
  const [done, setDone] = useState<Record<string, DoneSummary>>({});
  const [results, setResults] = useState<StudentLessonResult[]>([]);
  const [students, setStudents] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    questFetch<{ data?: TeacherClass[] }>("/api/classes")
      .then((r) => { setClasses(r.data ?? []); setClassId((id) => id ?? r.data?.[0]?.id ?? null); })
      .catch(() => setClasses([]));
  }, [enabled]);

  const load = useCallback(async (id: string) => {
    try {
      const r = await questFetch<{
        assigned: AssignedLesson[];
        opened: Record<string, number>;
        done?: Record<string, DoneSummary>;
        results?: StudentLessonResult[];
        students: number;
      }>(`/api/classes/${id}/textbook`);
      setAssigned(r.assigned);
      setOpened(r.opened);
      setDone(r.done ?? {});
      setResults(r.results ?? []);
      setStudents(r.students);
    } catch { setAssigned([]); setOpened({}); setDone({}); setResults([]); }
  }, []);
  useEffect(() => { if (classId) load(classId); }, [classId, load]);

  const save = async (next: AssignedLesson[], message: string) => {
    if (!classId) return;
    setSaving(true);
    try {
      await questFetch(`/api/classes/${classId}`, { method: "PATCH", body: JSON.stringify({ settings: { assigned_lessons: next } }) });
      setAssigned(next);
      toast({ title: message });
      load(classId);
    } catch (e) {
      toast({ title: "Couldn't save", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return {
    classes, classId, setClassId, assigned, opened, done, results, students, saving,
    assign: (ids: string[], due: string | null) => {
      const now = new Date().toISOString();
      const rest = assigned.filter((a) => !ids.includes(a.skill_id));
      return save([...rest, ...ids.map((skill_id) => ({ skill_id, due, assigned_at: now }))], ids.length === 1 ? "Lesson assigned" : `${ids.length} lessons assigned`);
    },
    unassign: (id: string) => save(assigned.filter((a) => a.skill_id !== id), "Lesson unassigned"),
  };
}

/** The textbook's table of contents: one book per grade, a unit per NAD topic, chapters of up to 4 lessons. */
export default function TextbookPage() {
  const { role, gradeLevel, teachingMode, assignedLessons, textbookResults } = useAppState();
  const { mentorId } = useMentorChoice();
  const studentGrade = Number(gradeLevel);
  const isTeacher = role === "teacher";
  const [grade, setGrade] = useState(GRADES.includes(studentGrade) ? studentGrade : 6);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [dialog, setDialog] = useState<{ ids: string[]; title: string } | null>(null);
  const [due, setDue] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const eligible = isTeacher || (role === "k12" && GRADES.includes(studentGrade));
  const teacher = useTeacherAssignments(isTeacher);

  useEffect(() => { if (GRADES.includes(studentGrade)) setGrade(studentGrade); }, [studentGrade]);
  useEffect(() => {
    if (role !== "k12") return;
    questFetch<{ skills?: { id: string; score: number; practiced: boolean }[] }>(`/api/quest/me?tz=${new Date().getTimezoneOffset()}`)
      .then((r) => setScores(Object.fromEntries((r.skills ?? []).filter((s) => s.practiced).map((s) => [s.id, s.score]))))
      .catch(() => {});
  }, [role]);

  // The assignments shown: the chosen class's for a teacher, all of a student's classes for a student
  const assignedById = useMemo(() => new Map<string, AssignedLesson>(
    (isTeacher ? teacher.assigned : assignedLessons).map((a) => [a.skill_id, a])), [isTeacher, teacher.assigned, assignedLessons]);
  const sortedAssignedLessons = useMemo(() =>
    [...assignedLessons].sort((a, b) => Number(!!textbookResults[a.skill_id]) - Number(!!textbookResults[b.skill_id])),
  [assignedLessons, textbookResults]);
  const allAssignedDone = assignedLessons.length > 0 && assignedLessons.every((a) => !!textbookResults[a.skill_id]);

  if (role && !eligible) {
    return <p className="text-muted-foreground">The math textbook is for students in grades 6–8 and their teachers.</p>;
  }

  const openAssign = (ids: string[], title: string) => { setDue(""); setDialog({ ids, title }); };
  const className = teacher.classes?.find((c) => c.id === teacher.classId)?.name ?? "your class";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          {mentorId && teachingMode === "mentor" && !isTeacher
            ? <MentorAvatar mentorId={mentorId} size={64} />
            : <Library className="h-10 w-10 text-primary" />}
          <div>
            <h1 className="text-2xl font-bold font-headline tracking-tight sm:text-3xl">Math Textbook</h1>
            <p className="text-muted-foreground">
              {isTeacher
                ? "Assign lessons to your class. Students read them with their mentor, try each step, and finish a worksheet."
                : "Read a lesson with your mentor, try each step, then finish the worksheet."}
            </p>
          </div>
        </div>
        <div className="flex gap-1 rounded-lg border p-1">
          {GRADES.map((g) => (
            <button key={g} type="button" onClick={() => setGrade(g)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${grade === g ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              Grade {g}
            </button>
          ))}
        </div>
      </header>

      {/* Teacher: which class, and what it has assigned */}
      {isTeacher && (
        <section className="space-y-3 rounded-xl border bg-card p-4">
          {teacher.classes === null ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading your classes…</p>
          ) : teacher.classes.length === 0 ? (
            <p className="text-sm">Create a class first, then you can assign lessons to it. <Link href="/dashboard" className="font-medium text-primary hover:underline">Go to My Class</Link></p>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Assigning to</span>
                  {teacher.classes.length > 1 ? (
                    <Select value={teacher.classId ?? undefined} onValueChange={teacher.setClassId}>
                      <SelectTrigger className="h-8 w-48"><SelectValue /></SelectTrigger>
                      <SelectContent>{teacher.classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : <span className="font-semibold">{className}</span>}
                </div>
                <p className="text-sm text-muted-foreground">{teacher.assigned.length} lesson{teacher.assigned.length === 1 ? "" : "s"} assigned · {teacher.students} student{teacher.students === 1 ? "" : "s"}</p>
              </div>
              {teacher.assigned.length > 0 && (
                <ul className="divide-y rounded-lg border text-sm">
                  {[...teacher.assigned].sort((a, b) => (a.due ?? "9999").localeCompare(b.due ?? "9999")).map((a) => {
                    const doneSummary = teacher.done[a.skill_id];
                    const isExpanded = !!expanded[a.skill_id];
                    const lessonResults = teacher.results.filter((r) => r.skill_id === a.skill_id);
                    return (
                      <li key={a.skill_id}>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
                          <button type="button" onClick={() => setExpanded((prev) => ({ ...prev, [a.skill_id]: !prev[a.skill_id] }))}
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                            aria-expanded={isExpanded} aria-label={`Toggle results for ${lessonName(a.skill_id)}`}>
                            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </button>
                          <Link href={`/textbook/${a.skill_id}`} className="flex-1 font-medium hover:text-primary">{lessonName(a.skill_id)}</Link>
                          <DueChip due={a.due} />
                          <span className="text-xs text-muted-foreground">{teacher.opened[a.skill_id] ?? 0} of {teacher.students} opened</span>
                          <span className="text-xs text-muted-foreground">
                            {doneSummary ? `${doneSummary.count} done · avg ${doneSummary.average}%` : "0 done"}
                          </span>
                          <button type="button" disabled={teacher.saving} onClick={() => teacher.unassign(a.skill_id)}
                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Unassign ${lessonName(a.skill_id)}`}>
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        {isExpanded && (
                          <div className="border-t bg-muted/30 px-3 py-2">
                            {lessonResults.length === 0 ? (
                              <p className="text-xs text-muted-foreground">No one has finished it yet.</p>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="border-b text-muted-foreground">
                                      <th className="py-1 pr-3 font-medium">Student</th>
                                      <th className="py-1 pr-3 font-medium">Best score</th>
                                      <th className="py-1 pr-3 font-medium">Attempts</th>
                                      <th className="py-1 font-medium">Finished</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border/50">
                                    {lessonResults.map((r) => (
                                      <tr key={r.student_id}>
                                        <td className="py-1.5 pr-3 font-medium">{r.name}</td>
                                        <td className="py-1.5 pr-3 tabular-nums">{r.best_score}%</td>
                                        <td className="py-1.5 pr-3 tabular-nums">{r.attempts}</td>
                                        <td className="py-1.5 text-muted-foreground">{new Date(r.completed_at).toLocaleDateString()}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </section>
      )}

      {/* Student: what their teacher assigned */}
      {!isTeacher && assignedLessons.length > 0 && (
        <section className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
          <h2 className="mb-2 flex items-center gap-2 font-semibold">
            <ClipboardList className="h-5 w-5 text-primary" />
            {allAssignedDone ? "Assigned by your teacher · all done!" : "Assigned by your teacher"}
          </h2>
          <ul className="divide-y rounded-lg border bg-card text-sm">
            {sortedAssignedLessons.map((a) => {
              const result = textbookResults[a.skill_id];
              return (
                <li key={`${a.class_name}-${a.skill_id}`}>
                  <Link href={`/textbook/${a.skill_id}`} className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 hover:bg-muted ${result ? "opacity-60" : ""}`}>
                    <span className="flex-1 font-medium">{lessonName(a.skill_id)}</span>
                    <span className="text-xs text-muted-foreground">{a.class_name}</span>
                    {result ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                        <CheckCircle2 className="h-4 w-4" />{result.best_score}%
                      </span>
                    ) : (
                      <>
                        <DueChip due={a.due} />
                        {scores[a.skill_id] === 100 && <CheckCircle2 className="h-4 w-4 text-green-600" aria-label="Mastered" />}
                      </>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="space-y-5">
        {textbookUnits(grade).map((unit, i) => (
          <motion.section key={`${grade}-${unit.letter}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 8) * 0.04 }} className="overflow-hidden rounded-xl border bg-card shadow-sm">
            <div className={`px-4 py-3 text-white ${CHAPTER_COLORS[i % CHAPTER_COLORS.length]}`}>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Unit {unit.letter} · NAD {unit.nad}</p>
              <h2 className="font-semibold">{unit.title}</h2>
            </div>
            <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
              {unit.chapters.map((chapter) => {
                const unassigned = chapter.skillIds.filter((id) => !assignedById.has(id));
                return (
                  <div key={chapter.number} className="bg-card p-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">
                        Chapter {chapter.number}
                        {chapter.parts > 1 && <span className="font-normal text-muted-foreground"> · part {chapter.part} of {chapter.parts}</span>}
                      </p>
                      {isTeacher && teacher.classId && unassigned.length > 0 && (
                        <button type="button" className="text-xs font-medium text-primary hover:underline"
                          onClick={() => openAssign(unassigned, `Chapter ${chapter.number}`)}>
                          Assign chapter
                        </button>
                      )}
                    </div>
                    <ol>
                      {chapter.skillIds.map((id, n) => {
                        const s = SKILLS_BY_ID[id];
                        const score = scores[id];
                        const result = !isTeacher ? textbookResults[id] : undefined;
                        const a = assignedById.get(id);
                        return (
                          <li key={id} className="flex items-center gap-1 rounded-md hover:bg-muted">
                            <Link href={`/textbook/${id}`} className="flex flex-1 items-center gap-2 px-2 py-1.5 text-sm">
                              <span className="w-9 shrink-0 text-xs font-semibold text-muted-foreground">{chapter.number}.{n + 1}</span>
                              <span className="flex-1">
                                {s.name}{s.advanced && <span className="ml-1 text-amber-500" aria-label="Challenge">★</span>}
                                {a && <span className="ml-1.5 inline-flex rounded bg-primary/15 px-1.5 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide text-primary">Assigned</span>}
                              </span>
                              {result ? (
                                <span className="inline-flex items-center rounded bg-green-500/15 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-green-700 dark:text-green-400">
                                  {result.best_score}%
                                </span>
                              ) : score === 100 ? <CheckCircle2 className="h-4 w-4 text-green-600" aria-label="Mastered" />
                                : score !== undefined ? <span className="text-xs tabular-nums text-muted-foreground">{score}</span> : null}
                            </Link>
                            {isTeacher && teacher.classId && !a && (
                              <button type="button" onClick={() => openAssign([id], s.name)} aria-label={`Assign ${s.name}`}
                                className="mr-1 flex items-center gap-0.5 rounded px-1.5 py-1 text-xs font-medium text-primary hover:bg-primary/10">
                                <Plus className="h-3.5 w-3.5" /> Assign
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                );
              })}
            </div>
          </motion.section>
        ))}
      </div>

      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign {dialog?.title}</DialogTitle>
            <DialogDescription>
              {dialog && dialog.ids.length > 1 ? `${dialog.ids.length} lessons` : "This lesson"} will show up for every student in {className}, under &quot;Assigned by your teacher&quot;.
            </DialogDescription>
          </DialogHeader>
          {dialog && dialog.ids.length > 1 && (
            <ul className="list-disc space-y-0.5 pl-5 text-sm">{dialog.ids.map((id) => <li key={id}>{lessonName(id)}</li>)}</ul>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="due">Due date (optional)</Label>
            <Input id="due" type="date" value={due} onChange={(e) => setDue(e.target.value)} className="w-48" />
          </div>
          <DialogFooter className="gap-2">
            {dialog?.ids.length === 1 && (
              <Button variant="ghost" asChild><Link href={`/textbook/${dialog.ids[0]}`}><Eye className="mr-1.5 h-4 w-4" /> Preview</Link></Button>
            )}
            <Button disabled={teacher.saving} onClick={async () => { if (dialog) { await teacher.assign(dialog.ids, due || null); setDialog(null); } }}>
              {teacher.saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
