"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Printer } from "lucide-react";
import type { QuestClassData } from "./quest-teacher";

const pct = (x: number | null | undefined) => (x === null || x === undefined ? "—" : `${Math.round(x * 100)}%`);
const avg1 = (x: number | null | undefined) => (x === null || x === undefined ? "—" : x.toFixed(1));

export function FridayReport({ data, onAgree, onTeacherSurvey }: {
  data: QuestClassData;
  onAgree: (studentId: string, answer: "yes" | "partly" | "no") => Promise<void>;
  onTeacherSurvey: (rating: number, comment: string) => Promise<void>;
}) {
  const s = data.summary;
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(s.teacher_survey.length > 0);
  const growth = s.pre_average !== null && s.post_average !== null ? s.post_average - s.pre_average : null;

  return (
    <div className="space-y-4 print:space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Math Quest pilot report: {data.class.name}</h3>
          <p className="text-sm text-muted-foreground">Last 7 days</p>
        </div>
        <Button variant="outline" size="sm" className="print:hidden" onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Print
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Monday → Friday (practiced skills)" value={`${pct(s.pre_average)} → ${pct(s.post_average)}`} note={growth !== null ? `${growth >= 0 ? "+" : ""}${Math.round(growth * 100)} points` : "after the Friday check"} />
        <Stat label="Diagnostic matched teacher's view" value={`${s.teacher_agreement.yes} yes · ${s.teacher_agreement.partly} partly · ${s.teacher_agreement.no} no`} />
        <Stat label="Practice" value={`${s.practice_questions} questions`} note={`${s.minutes} minutes · ${s.mastered} skills mastered`} />
        <Stat label="Students (helpful / enjoyed, out of 5)" value={`${avg1(s.student_survey.helpful)} / ${avg1(s.student_survey.enjoyed)}`} note={`${s.student_survey.responses} responses`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Students</CardTitle>
          <CardDescription>For each student: does the diagnostic match what you see in class?</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Student</th>
                <th className="py-2 pr-3 font-medium">Weak spots found</th>
                <th className="py-2 pr-3 font-medium">Practice</th>
                <th className="py-2 pr-3 font-medium">Mon → Fri</th>
                <th className="py-2 font-medium">Matches what you see?</th>
              </tr>
            </thead>
            <tbody>
              {data.report.map((r) => (
                <tr key={r.student_id} className="border-b align-top last:border-0">
                  <td className="py-2 pr-3 font-medium">{r.name}<span className="block text-xs text-muted-foreground">Grade {r.grade}</span></td>
                  <td className="py-2 pr-3 text-xs">{r.diagnostic_done ? (r.diagnostic_gaps.join(", ") || "None") : <span className="text-muted-foreground">No diagnostic yet</span>}</td>
                  <td className="py-2 pr-3 text-xs">{r.practice_questions} q · {r.minutes} min{r.mastered_this_week ? ` · ${r.mastered_this_week} mastered` : ""}</td>
                  <td className="py-2 pr-3 text-xs">{r.post_done ? `${pct(r.pre_average)} → ${pct(r.post_average)}` : "—"}</td>
                  <td className="py-2">
                    {r.diagnostic_done ? (
                      <div className="flex gap-1 print:hidden">
                        {(["yes", "partly", "no"] as const).map((a) => (
                          <Button key={a} size="sm" variant={r.teacher_agrees === a ? "default" : "outline"} className="h-7 px-2 text-xs capitalize" onClick={() => onAgree(r.student_id, a)}>{a}</Button>
                        ))}
                      </div>
                    ) : null}
                    {r.teacher_agrees && <span className="hidden capitalize print:inline">{r.teacher_agrees}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {s.student_survey.comments.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">What students said</CardTitle></CardHeader>
          <CardContent><ul className="list-disc space-y-1 pl-5 text-sm">{s.student_survey.comments.map((c, i) => <li key={i}>{c}</li>)}</ul></CardContent>
        </Card>
      )}

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="text-base">Your feedback (2 minutes)</CardTitle>
          <CardDescription>How useful was Math Quest for you and your class this week?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sent ? <p className="text-sm">Thanks! Your feedback is saved.</p> : (
            <>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => <Button key={n} size="sm" variant={rating === n ? "default" : "outline"} onClick={() => setRating(n)}>{n}</Button>)}
              </div>
              <Textarea rows={3} maxLength={1000} placeholder="What worked? What should change? Did it save you time?" value={comment} onChange={(e) => setComment(e.target.value)} />
              <Button size="sm" disabled={!rating} onClick={async () => { await onTeacherSurvey(rating!, comment); setSent(true); }}>Send</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-lg font-semibold">{value}</p>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </CardContent>
    </Card>
  );
}
