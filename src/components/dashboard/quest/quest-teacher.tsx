"use client";

import { useCallback, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { questFetch } from "@/components/quest/quest-api";
import { QuestionBank } from "./question-bank";
import { ClassOverview } from "./class-overview";
import { FridayReport } from "./friday-report";

export interface QuestClassData {
  class: { id: string; name: string };
  focus_skill_ids: string[];
  post_check_open: boolean;
  all_skills: { id: string; name: string; grade: number }[];
  students: { id: string; name: string; grade: number }[];
  skills: { id: string; name: string; grade: number }[];
  heat: Record<string, Record<string, { p: number; status: string }>>;
  groups: { reason: string; students: string[] }[];
  report: {
    student_id: string; name: string; grade: number; diagnostic_done: boolean; diagnostic_gaps: string[];
    practice_questions: number; practice_correct: number; minutes: number; mastered_this_week: number;
    post_done: boolean; pre_average: number | null; post_average: number | null; teacher_agrees: string | null;
  }[];
  summary: {
    students: number; diagnostic_done: number; post_done: number; practice_questions: number; minutes: number; mastered: number;
    pre_average: number | null; post_average: number | null;
    teacher_agreement: { yes: number; partly: number; no: number };
    student_survey: { responses: number; helpful: number | null; enjoyed: number | null; comments: string[] };
    teacher_survey: { rating: number | null; comment: string | null }[];
  };
}

/** Teacher side of Math Quest (grades 6–8 adaptive math). */
export function QuestTeacher({ classes }: { classes: { id: string; name: string }[] }) {
  const { toast } = useToast();
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [data, setData] = useState<QuestClassData | null>(null);

  useEffect(() => {
    if (!classId && classes[0]) setClassId(classes[0].id);
  }, [classes, classId]);

  const load = useCallback(async () => {
    if (!classId) return;
    try {
      setData(await questFetch<QuestClassData>(`/api/quest/class/${classId}`));
    } catch (e) {
      toast({ title: "Math Quest", description: e instanceof Error ? e.message : "Couldn't load.", variant: "destructive" });
    }
  }, [classId, toast]);

  useEffect(() => { load(); }, [load]);

  const patch = async (body: object) => {
    try {
      await questFetch(`/api/quest/class/${classId}`, { method: "PATCH", body: JSON.stringify(body) });
      await load();
    } catch (e) {
      toast({ title: "Couldn't save", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
    }
  };

  const feedback = async (body: object) => {
    try {
      await questFetch("/api/quest/feedback", { method: "POST", body: JSON.stringify({ class_id: classId, ...body }) });
      await load();
    } catch (e) {
      toast({ title: "Couldn't save", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Math Quest</h2>
          <p className="text-sm text-muted-foreground">
            Adaptive math for grades 6–8: a short diagnostic finds each student&apos;s weak spots, then daily practice fixes them.
          </p>
        </div>
        {classes.length > 1 && (
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>{classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        )}
      </div>

      <Tabs defaultValue="class">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="class">Class overview</TabsTrigger>
          <TabsTrigger value="report">Friday report</TabsTrigger>
          <TabsTrigger value="bank">Question bank</TabsTrigger>
        </TabsList>
        <TabsContent value="class" className="mt-4">
          {!classId ? <p className="text-sm text-muted-foreground">Create a class first.</p>
            : !data ? <Loader2 className="h-5 w-5 animate-spin" />
            : <ClassOverview data={data} onSaveFocus={(skill_ids) => patch({ skill_ids })} onToggleCheck={(post_check_open) => patch({ post_check_open })} />}
        </TabsContent>
        <TabsContent value="report" className="mt-4">
          {!classId ? <p className="text-sm text-muted-foreground">Create a class first.</p>
            : !data ? <Loader2 className="h-5 w-5 animate-spin" />
            : <FridayReport data={data}
                onAgree={(student_id, answer) => feedback({ kind: "teacher_agreement", student_id, answer })}
                onTeacherSurvey={(rating, comment) => feedback({ kind: "teacher_survey", rating, comment })} />}
        </TabsContent>
        <TabsContent value="bank" className="mt-4">
          <QuestionBank />
        </TabsContent>
      </Tabs>
    </div>
  );
}
