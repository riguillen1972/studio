"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Users } from "lucide-react";
import type { QuestClassData } from "./quest-teacher";

const cellStyle = (cell?: { p: number; status: string }) => {
  if (!cell) return "bg-muted/40 text-muted-foreground";
  if (cell.status === "mastered") return "bg-green-500/80 text-white";
  if (cell.p >= 0.75) return "bg-green-500/35";
  if (cell.p >= 0.5) return "bg-blue-500/25";
  if (cell.p >= 0.3) return "bg-amber-500/35";
  return "bg-red-500/40";
};

export function ClassOverview({ data, onSaveFocus, onToggleCheck }: {
  data: QuestClassData;
  onSaveFocus: (skillIds: string[]) => Promise<void>;
  onToggleCheck: (open: boolean) => Promise<void>;
}) {
  const [editingFocus, setEditingFocus] = useState(false);
  const [focus, setFocus] = useState<string[]>(data.focus_skill_ids);
  const nameOf = (sid: string) => data.students.find((s) => s.id === sid)?.name ?? "Student";
  const grades = [...new Set(data.all_skills.map((s) => s.grade))].sort();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>This week</CardTitle>
          <CardDescription>
            {data.summary.diagnostic_done} of {data.summary.students} students finished the diagnostic ·{" "}
            {data.summary.practice_questions} practice questions · {data.summary.minutes} minutes · {data.summary.mastered} skills mastered
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              <span className="font-medium">Focus topic: </span>
              {data.focus_skill_ids.length
                ? data.focus_skill_ids.map((id) => data.all_skills.find((s) => s.id === id)?.name).join(", ")
                : "each student's grade-level skills (no focus set)"}
            </div>
            <Button size="sm" variant="outline" onClick={() => setEditingFocus((v) => !v)}>{editingFocus ? "Close" : "Choose focus skills"}</Button>
          </div>
          {editingFocus && (
            <div className="space-y-3 rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Pick what you&apos;re teaching this week (up to 12). About 60% of practice will come from these.</p>
              {grades.map((g) => (
                <div key={g}>
                  <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{g <= 5 ? `Foundation (grade ${g})` : `Grade ${g}`}</p>
                  <div className="flex flex-wrap gap-2">
                    {data.all_skills.filter((s) => s.grade === g).map((s) => {
                      const on = focus.includes(s.id);
                      return (
                        <button key={s.id} type="button"
                          onClick={() => setFocus(on ? focus.filter((f) => f !== s.id) : focus.length < 12 ? [...focus, s.id] : focus)}
                          className={`rounded-full border px-3 py-1 text-xs ${on ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/50"}`}>
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <Button size="sm" onClick={async () => { await onSaveFocus(focus); setEditingFocus(false); }}>Save focus</Button>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Switch id="postCheck" checked={data.post_check_open} onCheckedChange={onToggleCheck} />
            <Label htmlFor="postCheck" className="text-sm">
              End-of-week check is {data.post_check_open ? "open" : "closed"} for students
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suggested small groups</CardTitle>
          <CardDescription>Students who share a weak skill or keep making the same mistake. Ten minutes together can fix it.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.groups.length === 0 && <p className="text-sm text-muted-foreground">Groups appear once students finish the diagnostic and practice a bit.</p>}
          {data.groups.map((g, i) => (
            <div key={i} className="flex items-start gap-3 rounded-md border p-3 text-sm">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="font-medium">{g.reason}</p>
                <p className="text-muted-foreground">{g.students.map(nameOf).join(", ")}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skills heat map</CardTitle>
          <CardDescription>Each square is one student&apos;s mastery of one skill. Red means a weak spot; green means mastered.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {data.skills.length === 0 || data.students.length === 0 ? (
            <p className="text-sm text-muted-foreground">The heat map fills in after students take the diagnostic.</p>
          ) : (
            <table className="text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-card p-1 text-left font-medium">Skill</th>
                  {data.students.map((s) => (
                    <th key={s.id} className="p-1 font-medium" title={s.name}>
                      <span className="block max-w-[56px] truncate">{s.name.split(" ")[0]}</span>
                      <span className="text-muted-foreground">Gr {s.grade}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.skills.map((sk) => (
                  <tr key={sk.id}>
                    <td className="sticky left-0 bg-card p-1 pr-3 whitespace-nowrap">
                      {sk.name}{data.focus_skill_ids.includes(sk.id) && <span className="ml-1 text-primary">●</span>}
                    </td>
                    {data.students.map((st) => {
                      const cell = data.heat[st.id]?.[sk.id];
                      return (
                        <td key={st.id} className="p-0.5">
                          <div className={`flex h-7 w-12 items-center justify-center rounded ${cellStyle(cell)}`}
                            title={`${st.name}: ${sk.name}${cell ? ` (${Math.round(cell.p * 100)}%)` : " (not tested)"}`}>
                            {cell ? Math.round(cell.p * 100) : ""}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
