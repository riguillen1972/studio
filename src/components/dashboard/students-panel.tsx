"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Markdown } from "@/components/markdown";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users } from "lucide-react";

interface ClassOption { id: string; name: string }

interface StudentRow {
  id: string;
  name: string;
  grade_level: string | null;
  tier: string;
  ai_requests_this_week: number;
  last_active: string | null;
}
interface AssignmentCol { id: string; title: string; type: string; due_date: string | null }
interface SubmissionCell { id: string; context_pack_id: string; student_id: string; status: string; score: number | null; graded_by: string | null }

interface StudentDetail {
  student: { id: string; name: string; grade_level: string | null; tier: string };
  chats: { id: string; tool: string; prompt: string | null; response: string | null; created_at: string }[];
  apps: { id: string; name: string; description: string | null; conversation: { role: string; content: string }[] | null; created_at: string }[];
  submissions: {
    id: string; title: string; answers: string; status: string; score: number | null; graded_by: string | null;
    ai_feedback: { summary: string; items: { question: string; result: string; feedback: string }[] } | null;
    teacher_feedback: string | null; submitted_at: string;
  }[];
}

const TOOL_LABELS: Record<string, string> = {
  generateExplanation: "AI Tutor",
  provideHomeworkHints: "Homework Help",
  summarizeText: "Summarizer",
  scanHomework: "Scan Homework",
  generateQuiz: "Quiz Generator",
  generateQuizFromScan: "Quiz from Scan",
  getBibleVerse: "Bible Verse",
  generateFlashcards: "Flashcards",
  getFriendlyAdvice: "Study Buddy",
  generateMiniApp: "App Generator",
  interactWithMiniApp: "App Generator",
  runTool: "AI Tools",
  webTutor: "Web Tutor",
};

const when = (iso: string) =>
  new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export function StudentsPanel({ classes }: { classes: ClassOption[] }) {
  const { toast } = useToast();
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [assignments, setAssignments] = useState<AssignmentCol[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionCell[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const api = useCallback(async (path: string, init?: RequestInit) => {
    const { data: { session } } = await createClient().auth.getSession();
    if (!session) throw new Error("Your session has expired. Please sign in again.");
    const res = await fetch(path, {
      ...init,
      headers: { Authorization: `Bearer ${session.access_token}`, ...(init?.body ? { "Content-Type": "application/json" } : {}) },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Something went wrong.");
    return data;
  }, []);

  const loadClass = useCallback(async () => {
    if (!classId) return;
    setIsLoading(true);
    try {
      const data = await api(`/api/classes/${classId}/students`);
      setStudents(data.students);
      setAssignments(data.assignments);
      setSubmissions(data.submissions);
    } catch (e) {
      toast({ title: "Students", description: e instanceof Error ? e.message : "Couldn't load students.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [api, classId, toast]);

  useEffect(() => { loadClass(); }, [loadClass]);
  useEffect(() => {
    if (!classId && classes[0]) setClassId(classes[0].id);
  }, [classes, classId]);

  const openStudent = async (studentId: string) => {
    setIsDetailLoading(true);
    try {
      setDetail(await api(`/api/classes/${classId}/students/${studentId}`));
    } catch (e) {
      toast({ title: "Student", description: e instanceof Error ? e.message : "Couldn't load student.", variant: "destructive" });
    } finally {
      setIsDetailLoading(false);
    }
  };

  const saveGrade = async (submissionId: string, score: string, feedback: string) => {
    try {
      await api(`/api/submissions/${submissionId}`, {
        method: "PATCH",
        body: JSON.stringify({ score: Number(score), teacher_feedback: feedback }),
      });
      toast({ title: "Grade saved" });
      if (detail) openStudent(detail.student.id);
      loadClass();
    } catch (e) {
      toast({ title: "Grade", description: e instanceof Error ? e.message : "Couldn't save.", variant: "destructive" });
    }
  };

  if (classes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>Create a class and share its code to see your students here.</p>
        </CardContent>
      </Card>
    );
  }

  const cell = (studentId: string, packId: string) => submissions.find((s) => s.student_id === studentId && s.context_pack_id === packId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="grid gap-2 min-w-[220px]">
          <Label htmlFor="studentsClass">Class</Label>
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger id="studentsClass"><SelectValue /></SelectTrigger>
            <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {isLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mb-2" />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <CardDescription>Click a student to see their AI chats, the apps they made, and their work.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No students have joined this class yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="py-2 pr-4 font-medium">Student</th>
                  <th className="py-2 pr-4 font-medium">Grade</th>
                  <th className="py-2 pr-4 font-medium">Plan</th>
                  <th className="py-2 pr-4 font-medium">AI requests (7 days)</th>
                  <th className="py-2 pr-4 font-medium">Last active</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-muted/50 cursor-pointer" onClick={() => openStudent(s.id)}>
                    <td className="py-2 pr-4 font-medium text-primary">{s.name}</td>
                    <td className="py-2 pr-4">{s.grade_level ?? "—"}</td>
                    <td className="py-2 pr-4"><Badge variant={s.tier === "max" ? "default" : "outline"} className="capitalize">{s.tier}</Badge></td>
                    <td className="py-2 pr-4">{s.ai_requests_this_week}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{s.last_active ? when(s.last_active) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {students.length > 0 && assignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Gradebook</CardTitle>
            <CardDescription>Scores for homework and quizzes. AI grades appear automatically on Teacher Max; click a student to change any grade.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b">
                  <th className="py-2 pr-4 font-medium sticky left-0 bg-card">Student</th>
                  {assignments.map((a) => <th key={a.id} className="py-2 px-3 font-medium max-w-[140px] truncate" title={a.title}>{a.title}</th>)}
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium sticky left-0 bg-card">
                      <button className="text-primary hover:underline" onClick={() => openStudent(s.id)}>{s.name}</button>
                    </td>
                    {assignments.map((a) => {
                      const sub = cell(s.id, a.id);
                      return (
                        <td key={a.id} className="py-2 px-3 text-center">
                          {!sub ? <span className="text-muted-foreground">—</span>
                            : sub.score !== null ? `${sub.score}%${sub.graded_by === "ai" ? "*" : ""}`
                            : <span className="text-amber-600">Turned in</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-muted-foreground">* graded by AI</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!detail || isDetailLoading} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          {!detail ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{detail.student.name}</DialogTitle>
                <DialogDescription>
                  {[detail.student.grade_level ? `Grade ${detail.student.grade_level}` : null, `${detail.student.tier} plan`].filter(Boolean).join(" · ")}
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="chats" className="flex-1 flex flex-col min-h-0">
                <TabsList className="h-auto flex-wrap">
                  <TabsTrigger value="chats">AI chats ({detail.chats.length})</TabsTrigger>
                  <TabsTrigger value="apps">Apps ({detail.apps.length})</TabsTrigger>
                  <TabsTrigger value="work">Work ({detail.submissions.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="chats" className="flex-1 overflow-y-auto space-y-3 mt-3">
                  {detail.chats.length === 0 && <p className="text-sm text-muted-foreground">No AI activity since joining your class.</p>}
                  {detail.chats.map((c) => (
                    <div key={c.id} className="rounded-md border p-3 text-sm space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span className="font-medium">{TOOL_LABELS[c.tool] ?? c.tool}</span>
                        <span>{when(c.created_at)}</span>
                      </div>
                      {c.prompt && <p className="rounded bg-primary/10 p-2 whitespace-pre-wrap break-words">{c.prompt}</p>}
                      {c.response && (
                        <details>
                          <summary className="cursor-pointer text-muted-foreground">AI answer</summary>
                          <div className="mt-2"><Markdown>{c.response}</Markdown></div>
                        </details>
                      )}
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="apps" className="flex-1 overflow-y-auto space-y-3 mt-3">
                  {detail.apps.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      {detail.student.tier === "max" ? "No saved apps yet." : "The App Generator is part of the Max plan."}
                    </p>
                  )}
                  {detail.apps.map((a) => (
                    <div key={a.id} className="rounded-md border p-3 text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{a.name}</span>
                        <span className="text-xs text-muted-foreground">{when(a.created_at)}</span>
                      </div>
                      {a.description && <p className="text-muted-foreground">{a.description}</p>}
                      {(a.conversation?.length ?? 0) > 0 && (
                        <details>
                          <summary className="cursor-pointer text-muted-foreground">Show app conversation ({a.conversation!.length} messages)</summary>
                          <div className="mt-2 space-y-2">
                            {a.conversation!.map((t, i) => (
                              <div key={i} className={t.role === "user" ? "rounded bg-primary/10 p-2" : "rounded bg-muted p-2"}>
                                <Markdown>{t.content}</Markdown>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="work" className="flex-1 overflow-y-auto space-y-3 mt-3">
                  {detail.submissions.length === 0 && <p className="text-sm text-muted-foreground">Nothing turned in yet.</p>}
                  {detail.submissions.map((s) => <SubmissionCard key={s.id} submission={s} onSave={saveGrade} />)}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SubmissionCard({ submission: s, onSave }: {
  submission: StudentDetail["submissions"][number];
  onSave: (id: string, score: string, feedback: string) => Promise<void>;
}) {
  const [score, setScore] = useState(s.score !== null ? String(s.score) : "");
  const [feedback, setFeedback] = useState(s.teacher_feedback ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const valid = /^\d+$/.test(score) && Number(score) <= 100;

  return (
    <div className="rounded-md border p-3 text-sm space-y-3">
      <div className="flex justify-between gap-2">
        <span className="font-medium">{s.title}</span>
        <span className="text-xs text-muted-foreground">Turned in {when(s.submitted_at)}</span>
      </div>
      <details>
        <summary className="cursor-pointer text-muted-foreground">Student&apos;s answers</summary>
        <p className="mt-2 whitespace-pre-wrap break-words rounded bg-muted p-2">{s.answers}</p>
      </details>
      {s.ai_feedback && (
        <div className="space-y-1">
          <p><span className="font-medium">AI grade: {s.graded_by === "ai" ? `${s.score}%` : "(changed by you)"}</span> — {s.ai_feedback.summary}</p>
          <ul className="text-muted-foreground">
            {s.ai_feedback.items.map((item, i) => <li key={i}>{item.question}: <span className="font-medium">{item.result}</span>. {item.feedback}</li>)}
          </ul>
        </div>
      )}
      <div className="grid gap-2 sm:grid-cols-[100px_1fr_auto] sm:items-end">
        <div className="grid gap-1">
          <Label htmlFor={`score-${s.id}`} className="text-xs">Score (%)</Label>
          <Input id={`score-${s.id}`} inputMode="numeric" value={score} onChange={(e) => setScore(e.target.value)} />
        </div>
        <div className="grid gap-1">
          <Label htmlFor={`fb-${s.id}`} className="text-xs">Your feedback (the student sees this)</Label>
          <Textarea id={`fb-${s.id}`} rows={1} maxLength={2000} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        </div>
        <Button
          size="sm"
          disabled={!valid || isSaving}
          onClick={async () => { setIsSaving(true); await onSave(s.id, score, feedback); setIsSaving(false); }}
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save grade
        </Button>
      </div>
    </div>
  );
}
