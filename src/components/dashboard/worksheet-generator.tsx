"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { dueDateToIso, todayIso } from "@/lib/dates";
import { worksheetToAnswerKey, worksheetToStudentMarkdown, type Worksheet } from "@/lib/worksheet-format";
import { FileText, Loader2, Lock, Printer, Save, Sparkles, Trash2 } from "lucide-react";

interface ClassOption { id: string; name: string; subject: string | null }

interface WorksheetGeneratorProps {
  tier: string;
  classes: ClassOption[];
  onSaved: () => void;
}

const GRADES = [...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `Grade ${i + 1}` })), { value: "college", label: "College" }];
const STYLES = [
  { value: "mixed", label: "Mixed" },
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "short_answer", label: "Short answer" },
  { value: "word_problems", label: "Word problems" },
];

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function printWorksheet(w: Worksheet, withAnswers: boolean) {
  const win = window.open("", "_blank");
  if (!win) return;
  const questions = w.questions.map((q, i) => `
    <li>
      <p>${escapeHtml(q.prompt)}</p>
      ${q.choices.length ? `<ol type="A">${q.choices.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ol>` : `<div class="lines"></div>`}
      ${withAnswers ? `<p class="answer"><strong>Answer:</strong> ${escapeHtml(q.answer)}${q.explanation ? ` <em>(${escapeHtml(q.explanation)})</em>` : ""}</p>` : ""}
    </li>`).join("");
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(w.title)}</title>
    <style>
      body { font-family: Georgia, serif; max-width: 720px; margin: 32px auto; padding: 0 24px; color: #111; }
      h1 { font-size: 22px; margin-bottom: 4px; }
      .meta { display: flex; gap: 32px; margin: 16px 0 24px; }
      .meta span { flex: 1; border-bottom: 1px solid #555; padding-bottom: 2px; }
      li { margin-bottom: 18px; } ol[type="A"] li { margin-bottom: 4px; }
      .lines { height: 56px; border-bottom: 1px solid #bbb; }
      .answer { color: #0a5; margin-top: 6px; }
    </style></head><body>
    <h1>${escapeHtml(w.title)}${withAnswers ? " (Answer Key)" : ""}</h1>
    ${withAnswers ? "" : `<div class="meta"><span>Name:</span><span>Date:</span></div>`}
    <p><strong>${escapeHtml(w.instructions)}</strong></p>
    <ol>${questions}</ol>
    </body></html>`);
  win.document.close();
  win.focus();
  win.print();
}

export function WorksheetGenerator({ tier, classes, onSaved }: WorksheetGeneratorProps) {
  const { toast } = useToast();
  const [request, setRequest] = useState("");
  const [grade, setGrade] = useState("");
  const [questionCount, setQuestionCount] = useState("10");
  const [questionStyle, setQuestionStyle] = useState("mixed");
  const [worksheet, setWorksheet] = useState<Worksheet | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveClassId, setSaveClassId] = useState("");
  const [saveType, setSaveType] = useState("homework");
  const [saveDueDate, setSaveDueDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const authHeaders = async () => {
    const { data: { session } } = await createClient().auth.getSession();
    if (!session) throw new Error("Your session has expired. Please sign in again.");
    return { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" };
  };

  const generate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/worksheets", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ request, grade, questionCount: Number(questionCount), questionStyle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't create the worksheet.");
      setWorksheet(data.worksheet);
      setShowAnswers(false);
    } catch (e) {
      toast({ title: "Worksheet", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const save = async () => {
    if (!worksheet || !saveClassId) return;
    setIsSaving(true);
    try {
      const studentCopy = worksheetToStudentMarkdown(worksheet);
      const res = await fetch("/api/context-packs", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({
          class_id: saveClassId,
          title: worksheet.title,
          subject: classes.find((c) => c.id === saveClassId)?.subject ?? null,
          type: saveType,
          content_raw: studentCopy,
          due_date: dueDateToIso(saveDueDate),
          generated: { content_parsed: studentCopy, answer_key: worksheetToAnswerKey(worksheet) },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't save the worksheet.");
      toast({ title: "Assigned!", description: "Students will see it in My Assignments. The answer key stays hidden from them." });
      onSaved();
    } catch (e) {
      toast({ title: "Worksheet", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const removeQuestion = (index: number) =>
    setWorksheet((w) => (w ? { ...w, questions: w.questions.filter((_, i) => i !== index) } : w));

  if (tier !== "max") {
    return (
      <Card className="border-purple-500/20 bg-purple-500/5">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-2">
            <Lock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <CardTitle className="text-2xl">AI Worksheet Maker</CardTitle>
          <CardDescription className="text-base max-w-lg mx-auto mt-2">
            Describe a worksheet and get printable questions with an answer key in seconds, ready to assign to your class. Included in Teacher Max.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center pb-8">
          <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700 text-white rounded-full">
            <Link href="/profile#plans">{tier === "student-max" ? "Switch to Teacher Max to Unlock" : "Upgrade to Max to Unlock"}</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-purple-500" /> AI Worksheet Maker</CardTitle>
          <CardDescription>Tell the AI what you need. You get a worksheet and an answer key you can print or assign.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="wsRequest">What should the worksheet cover?</Label>
            <Textarea
              id="wsRequest"
              rows={3}
              maxLength={2000}
              placeholder="e.g. Adding fractions with unlike denominators, using pizza and recipe examples. Start easy and get harder."
              value={request}
              onChange={(e) => setRequest(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="wsGrade">Grade</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger id="wsGrade"><SelectValue placeholder="Select grade" /></SelectTrigger>
                <SelectContent>{GRADES.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="wsCount">Questions</Label>
              <Select value={questionCount} onValueChange={setQuestionCount}>
                <SelectTrigger id="wsCount"><SelectValue /></SelectTrigger>
                <SelectContent>{["5", "10", "15", "20", "25"].map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="wsStyle">Question style</Label>
              <Select value={questionStyle} onValueChange={setQuestionStyle}>
                <SelectTrigger id="wsStyle"><SelectValue /></SelectTrigger>
                <SelectContent>{STYLES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={generate} disabled={isGenerating || request.trim().length < 5 || !grade} className="bg-purple-600 hover:bg-purple-700 text-white">
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {worksheet ? "Make a new version" : "Make worksheet"}
          </Button>
        </CardFooter>
      </Card>

      {worksheet && (
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Input
                value={worksheet.title}
                onChange={(e) => setWorksheet({ ...worksheet, title: e.target.value })}
                className="text-lg font-semibold max-w-md"
                aria-label="Worksheet title"
              />
              <div className="flex items-center gap-2">
                <Switch id="wsAnswers" checked={showAnswers} onCheckedChange={setShowAnswers} />
                <Label htmlFor="wsAnswers" className="text-sm">Show answers</Label>
              </div>
            </div>
            <Textarea
              value={worksheet.instructions}
              onChange={(e) => setWorksheet({ ...worksheet, instructions: e.target.value })}
              rows={2}
              aria-label="Instructions"
            />
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {worksheet.questions.map((q, i) => (
                <li key={i} className="flex gap-3 rounded-md border p-3">
                  <span className="font-semibold">{i + 1}.</span>
                  <div className="flex-1 space-y-1 text-sm">
                    <p>{q.prompt}</p>
                    {q.choices.length > 0 && (
                      <ul className="pl-1 text-muted-foreground">
                        {q.choices.map((c, j) => <li key={j}>{String.fromCharCode(65 + j)}. {c}</li>)}
                      </ul>
                    )}
                    {showAnswers && (
                      <p className="text-green-700 dark:text-green-400">
                        <strong>Answer:</strong> {q.answer}{q.explanation && <span className="text-muted-foreground"> ({q.explanation})</span>}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeQuestion(i)} title="Remove question">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ol>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-4 border-t pt-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => printWorksheet(worksheet, false)}><Printer className="mr-2 h-4 w-4" /> Print student copy</Button>
              <Button variant="outline" onClick={() => printWorksheet(worksheet, true)}><FileText className="mr-2 h-4 w-4" /> Print answer key</Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-4 sm:items-end">
              <div className="grid gap-2">
                <Label htmlFor="wsClass">Assign to class</Label>
                <Select value={saveClassId} onValueChange={setSaveClassId}>
                  <SelectTrigger id="wsClass"><SelectValue placeholder={classes.length ? "Select a class" : "Create a class first"} /></SelectTrigger>
                  <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="wsType">As</Label>
                <Select value={saveType} onValueChange={setSaveType}>
                  <SelectTrigger id="wsType"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="homework">Homework</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="wsDue">Due date (optional)</Label>
                <Input id="wsDue" type="date" min={todayIso()} value={saveDueDate} onChange={(e) => setSaveDueDate(e.target.value)} />
              </div>
              <Button onClick={save} disabled={!saveClassId || isSaving || worksheet.questions.length === 0}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Assign
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
