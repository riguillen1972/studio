"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MISCONCEPTIONS_BY_ID } from "@/lib/quest/misconceptions";
import type { QuestChoice } from "@/lib/quest/answers";
import { Check, Loader2, Pencil, Sparkles, X } from "lucide-react";

interface BankSkill { id: string; name: string; grade: number; standard: string; approved: number; draft: number }
interface BankItem {
  id: string; skill_id: string; difficulty: number; kind: "multiple_choice" | "numeric";
  stem: string; choices: QuestChoice[] | null; answer: string; explanation: string; status: string;
}

// Questions a student needs per skill for a solid week: diagnostic + practice + post-check
const TARGET_PER_SKILL = 15;

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await createClient().auth.getSession();
  if (!session) throw new Error("Your session has expired. Please sign in again.");
  return { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" };
}

export function QuestionBank() {
  const { toast } = useToast();
  const [skills, setSkills] = useState<BankSkill[]>([]);
  const [selected, setSelected] = useState<BankSkill | null>(null);
  const [items, setItems] = useState<BankItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadBank = useCallback(async () => {
    try {
      const res = await fetch("/api/quest/bank", { headers: await authHeaders() });
      const data = await res.json();
      if (res.ok) setSkills(data.skills);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadItems = useCallback(async (skillId: string) => {
    const res = await fetch(`/api/quest/items?skill_id=${encodeURIComponent(skillId)}`, { headers: await authHeaders() });
    const data = await res.json();
    if (res.ok) setItems(data.items.filter((i: BankItem) => i.status !== "rejected"));
  }, []);

  useEffect(() => { loadBank(); }, [loadBank]);

  const open = (skill: BankSkill) => {
    setSelected(skill);
    setItems([]);
    loadItems(skill.id);
  };

  const generate = async () => {
    if (!selected) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/quest/items/generate", {
        method: "POST", headers: await authHeaders(), body: JSON.stringify({ skill_id: selected.id, count: 8 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({
        title: `${data.items.length} questions drafted`,
        description: data.dropped ? `${data.dropped} failed the accuracy check and were thrown out.` : "All passed the accuracy check.",
      });
      await Promise.all([loadItems(selected.id), loadBank()]);
    } catch (e) {
      toast({ title: "Couldn't draft questions", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const update = async (item: BankItem, changes: Partial<BankItem>) => {
    try {
      const res = await fetch(`/api/quest/items/${item.id}`, {
        method: "PATCH", headers: await authHeaders(), body: JSON.stringify(changes),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems((prev) => data.item.status === "rejected"
        ? prev.filter((i) => i.id !== item.id)
        : prev.map((i) => (i.id === item.id ? data.item : i)));
      setEditingId(null);
      loadBank();
    } catch (e) {
      toast({ title: "Couldn't save", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
    }
  };

  const approveAll = async () => {
    for (const item of items.filter((i) => i.status === "draft")) await update(item, { status: "approved" });
  };

  const grades = [...new Set(skills.map((s) => s.grade))].sort();
  const drafts = items.filter((i) => i.status === "draft");

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Question bank</CardTitle>
          <CardDescription>
            Students only see questions a teacher has approved. Aim for about {TARGET_PER_SKILL} approved questions per skill.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {grades.map((g) => (
            <div key={g}>
              <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                {g <= 5 ? `Foundation (grade ${g})` : `Grade ${g}`}
              </p>
              <ul className="space-y-1">
                {skills.filter((s) => s.grade === g).map((s) => (
                  <li key={s.id}>
                    <button
                      onClick={() => open(s)}
                      className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted ${selected?.id === s.id ? "bg-muted" : ""}`}
                    >
                      <span className="truncate">{s.name}</span>
                      <span className="flex shrink-0 gap-1">
                        {s.draft > 0 && <Badge variant="outline" className="border-amber-500 text-amber-600">{s.draft} to review</Badge>}
                        <Badge variant={s.approved >= TARGET_PER_SKILL ? "default" : "secondary"}>{s.approved} ready</Badge>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {skills.length === 0 && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        </CardContent>
      </Card>

      <Card>
        {!selected ? (
          <CardContent className="py-16 text-center text-sm text-muted-foreground">Pick a skill to draft and review its questions.</CardContent>
        ) : (
          <>
            <CardHeader>
              <CardTitle className="text-lg">{selected.name}</CardTitle>
              <CardDescription>Standard {selected.standard}</CardDescription>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" onClick={generate} disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Draft 8 questions
                </Button>
                {drafts.length > 1 && (
                  <Button size="sm" variant="outline" onClick={approveAll}>Approve all {drafts.length} drafts</Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.length === 0 && <p className="text-sm text-muted-foreground">No questions yet. Draft some to get started.</p>}
              {items.map((item) =>
                editingId === item.id ? (
                  <EditItem key={item.id} item={item} onCancel={() => setEditingId(null)} onSave={(changes) => update(item, changes)} />
                ) : (
                  <div key={item.id} className="rounded-md border p-3 text-sm space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex gap-1">
                        <Badge variant="outline">{["", "Easy", "Medium", "Hard"][item.difficulty]}</Badge>
                        <Badge variant="outline">{item.kind === "numeric" ? "Type answer" : "Multiple choice"}</Badge>
                        {item.status === "approved"
                          ? <Badge>Approved</Badge>
                          : <Badge variant="outline" className="border-amber-500 text-amber-600">Needs review</Badge>}
                      </div>
                      <div className="flex gap-1">
                        {item.status !== "approved" && (
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" title="Approve" onClick={() => update(item, { status: "approved" })}>
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-7 w-7" title="Edit" onClick={() => setEditingId(item.id)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" title="Reject" onClick={() => update(item, { status: "rejected" })}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="font-medium whitespace-pre-wrap">{item.stem}</p>
                    {item.choices ? (
                      <ul className="space-y-0.5">
                        {item.choices.map((c, i) => (
                          <li key={i} className={c.correct ? "font-medium text-green-700 dark:text-green-400" : "text-muted-foreground"}>
                            {String.fromCharCode(65 + i)}. {c.text}
                            {c.correct ? " ✓" : c.misconception ? ` (${MISCONCEPTIONS_BY_ID[c.misconception]?.name ?? c.misconception})` : ""}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>Answer: <span className="font-medium text-green-700 dark:text-green-400">{item.answer}</span></p>
                    )}
                    <p className="text-xs text-muted-foreground">{item.explanation}</p>
                  </div>
                )
              )}
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}

function EditItem({ item, onSave, onCancel }: {
  item: BankItem;
  onSave: (changes: Partial<BankItem>) => void;
  onCancel: () => void;
}) {
  const [stem, setStem] = useState(item.stem);
  const [answer, setAnswer] = useState(item.answer);
  const [explanation, setExplanation] = useState(item.explanation);
  const [choices, setChoices] = useState<QuestChoice[]>(item.choices ?? []);

  return (
    <div className="rounded-md border border-primary p-3 space-y-3 text-sm">
      <div className="grid gap-1">
        <Label>Question</Label>
        <Textarea rows={3} value={stem} onChange={(e) => setStem(e.target.value)} />
      </div>
      {item.kind === "multiple_choice" ? (
        <div className="grid gap-1">
          <Label>Choices (select the correct one)</Label>
          {choices.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name={`correct-${item.id}`}
                checked={!!c.correct}
                onChange={() => setChoices(choices.map((x, j) => ({ ...x, correct: j === i })))}
                aria-label={`Choice ${i + 1} is correct`}
              />
              <Input value={c.text} onChange={(e) => setChoices(choices.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-1">
          <Label>Answer</Label>
          <Input value={answer} onChange={(e) => setAnswer(e.target.value)} />
        </div>
      )}
      <div className="grid gap-1">
        <Label>Explanation</Label>
        <Textarea rows={2} value={explanation} onChange={(e) => setExplanation(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onSave({
          stem, explanation, status: "approved",
          ...(item.kind === "multiple_choice" ? { choices } : { answer }),
        })}>
          Save and approve
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
