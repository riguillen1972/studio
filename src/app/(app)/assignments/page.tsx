"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Markdown } from "@/components/markdown";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/supabase/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { useAppState } from "@/components/app-state-provider";
import { BookDashed, CalendarClock, CheckCircle2, ChevronRight, FileQuestion, Folder, Lightbulb, Loader2, Send } from "lucide-react";

interface Assignment {
  id: string;
  class_id: string;
  type: "homework" | "quiz";
  title: string;
  subject: string | null;
  content_parsed: string | null;
  due_date: string | null;
  class_name: string;
  submission: Submission | null;
}

interface Submission {
  status: "submitted" | "graded";
  score: number | null;
  ai_feedback: { summary: string; items: { question: string; result: string; feedback: string }[] } | null;
  teacher_feedback: string | null;
}

const resultStyles: Record<string, string> = {
  correct: "text-green-600",
  partial: "text-amber-600",
  incorrect: "text-destructive",
  missing: "text-muted-foreground",
};

const typeColors: Record<string, string> = {
  homework: "bg-purple-500/20 text-purple-600",
  quiz: "bg-pink-500/20 text-pink-600",
};

function formatDue(due: string | null) {
  if (!due) return null;
  const date = new Date(due);
  const days = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
  const label = date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  if (days < 0) return { text: `Was due ${label}`, overdue: true };
  if (days === 0) return { text: "Due today", overdue: false };
  if (days === 1) return { text: "Due tomorrow", overdue: false };
  return { text: `Due ${label}`, overdue: false };
}

export default function AssignmentsPage() {
  const { user } = useAuth();
  const { classCode } = useAppState();
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const submit = async () => {
    if (!selected || !answers.trim()) return;
    setIsSubmitting(true);
    try {
      const { data: { session } } = await createClient().auth.getSession();
      if (!session) throw new Error("Please sign in again.");
      const res = await fetch(`/api/assignments/${selected.id}/submit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Couldn't submit.");
      const updated = { ...selected, submission: body.submission as Submission };
      setSelected(updated);
      setAssignments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setAnswers("");
      toast({ title: "Turned in!", description: body.submission.status === "graded" ? "Your grade is ready." : "Your teacher will grade it." });
    } catch (e) {
      toast({ title: "Couldn't submit", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // classCode changes when the student joins a class, so reload then
  useEffect(() => {
    if (!user) return;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data: { session } } = await createClient().auth.getSession();
        if (!session) return;
        const res = await fetch("/api/assignments", { headers: { Authorization: `Bearer ${session.access_token}` } });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error);
        setAssignments(body.data ?? []);
      } catch (e) {
        console.error("Error loading assignments:", e);
        setError("Failed to load assignments.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [user, classCode]);

  const openTool = (assignment: Assignment, tool: "homework" | "quiz") => {
    if (user) {
      // Lets teachers see that the student started the assignment
      createClient().from("study_tool_usage").insert({
        user_id: user.id,
        tool_id: tool,
        class_id: assignment.class_id,
        context_pack_id: assignment.id,
        input_summary: "Started assignment",
      }).then(({ error }) => { if (error) console.error("Failed to log assignment start:", error); });
    }
    const topic = [assignment.title, assignment.subject].filter(Boolean).join(" – ");
    router.push(tool === "homework"
      ? `/homework?assignment=${assignment.id}`
      : `/quiz?topic=${encodeURIComponent(topic)}`);
  };

  return (
    <div className="flex flex-col gap-8 h-full">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight flex items-center gap-2">
          <BookDashed className="w-8 h-8 text-primary" />
          My Assignments
        </h1>
        <p className="text-muted-foreground mt-1">Complete work assigned by your teachers.</p>
      </header>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground opacity-50" />
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <p className="text-destructive font-medium">{error}</p>
        </div>
      ) : assignments.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
          <CheckCircle2 className="w-16 h-16 text-green-500/80 mb-4" />
          <h3 className="text-xl font-medium text-foreground">You&apos;re all caught up!</h3>
          <p className="text-sm mt-2">
            {classCode ? "No active assignments from your teachers." : "Join your teacher's class from your Profile to see assignments here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((assignment) => {
            const due = formatDue(assignment.due_date);
            return (
              <Card
                key={assignment.id}
                className="hover:border-primary/50 transition-colors cursor-pointer group"
                onClick={() => setSelected(assignment)}
              >
                <CardContent className="p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className={`uppercase font-bold tracking-wider ${typeColors[assignment.type]} border-none`}>
                      {assignment.type}
                    </Badge>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="font-semibold text-lg leading-tight line-clamp-2">{assignment.title}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-auto">
                    <span className="flex items-center gap-2"><Folder className="w-4 h-4" />{assignment.class_name}</span>
                    {assignment.submission ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        {assignment.submission.status === "graded" && assignment.submission.score !== null
                          ? `Graded: ${assignment.submission.score}%` : "Turned in"}
                      </span>
                    ) : due && (
                      <span className={`flex items-center gap-1 ${due.overdue ? "text-destructive" : ""}`}>
                        <CalendarClock className="w-4 h-4" />{due.text}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) { setSelected(null); setAnswers(""); } }}>
        {selected && (
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="font-headline">{selected.title}</DialogTitle>
              <DialogDescription>
                {[selected.class_name, selected.subject, formatDue(selected.due_date)?.text].filter(Boolean).join(" · ")}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
              <div className="rounded-md border bg-muted/40 p-4 text-sm">
                {selected.content_parsed
                  ? <Markdown>{selected.content_parsed}</Markdown>
                  : <p className="text-muted-foreground">Your teacher didn&apos;t add instructions. Ask them if you&apos;re not sure what to do.</p>}
              </div>

              {selected.submission ? (
                <div className="rounded-md border p-4 space-y-3 text-sm">
                  {selected.submission.status === "graded" && selected.submission.score !== null ? (
                    <p className="text-lg font-semibold">Your grade: {selected.submission.score}%</p>
                  ) : (
                    <p className="font-medium flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /> Turned in. Your teacher will grade it.</p>
                  )}
                  {selected.submission.ai_feedback && (
                    <>
                      <p>{selected.submission.ai_feedback.summary}</p>
                      <ul className="space-y-1">
                        {selected.submission.ai_feedback.items.map((item, i) => (
                          <li key={i}>
                            <span className={`font-medium ${resultStyles[item.result] ?? ""}`}>{item.question}: {item.result}</span>
                            {" "}<span className="text-muted-foreground">{item.feedback}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {selected.submission.teacher_feedback && (
                    <p className="rounded-md bg-primary/10 p-3"><span className="font-medium">From your teacher:</span> {selected.submission.teacher_feedback}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="answers">Your answers</Label>
                  <Textarea
                    id="answers"
                    rows={6}
                    maxLength={10000}
                    placeholder="Write your answers here. Number them to match the questions, e.g. 1. 3/4"
                    value={answers}
                    onChange={(e) => setAnswers(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">You can turn this in once, so check your work first.</p>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              {!selected.submission && (
                <Button className="flex-1" onClick={submit} disabled={isSubmitting || !answers.trim()}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Turn in
                </Button>
              )}
              <Button className="flex-1" variant="outline" onClick={() => openTool(selected, "homework")} disabled={!selected.content_parsed}>
                <Lightbulb className="mr-2 h-4 w-4" /> Get hints for this
              </Button>
              <Button className="flex-1" variant="outline" onClick={() => openTool(selected, "quiz")}>
                <FileQuestion className="mr-2 h-4 w-4" /> Practice with a quiz
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
