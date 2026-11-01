"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { questFetch } from "@/components/quest/quest-api";
import { Loader2, Printer } from "lucide-react";
import type { StudentReport } from "@/lib/quest/engine";

interface ReportsResponse { class_name: string; teacher_name: string | null; reports: StudentReport[] }

export default function PrintParentReportPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
      <ParentReports />
    </Suspense>
  );
}

const level = (score: number) => (score >= 80 ? "Strong" : score >= 50 ? "Growing" : "Needs practice");

const HOME_TIPS = [
  "Ask your child to teach you one problem they solved this week. Explaining a step is one of the best ways to learn it.",
  "Short and often beats long and rare: 10–15 minutes of Math Quest on school days keeps the streak going.",
  "Look for math in daily life: sale prices, recipes, sports stats, travel time and the family budget.",
  "When your child is stuck, ask \"What do you already know?\" and \"What could you try first?\" before giving the answer.",
  "Praise effort and good thinking, not just right answers. Mistakes are how the app finds what to practice next.",
];

/** Plain-language summaries for families, one per printed page: one student or the whole class. */
function ParentReports() {
  const params = useSearchParams();
  const classId = params.get("class_id") ?? "";
  const student = params.get("student");
  const tz = params.get("tz") ?? "0";
  const [data, setData] = useState<ReportsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [onlyActive, setOnlyActive] = useState(false);
  const [withTips, setWithTips] = useState(true);

  useEffect(() => {
    questFetch<ReportsResponse>(`/api/quest/class/${encodeURIComponent(classId)}/reports?tz=${encodeURIComponent(tz)}${student ? `&student=${encodeURIComponent(student)}` : ""}`)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Couldn't load the reports."));
  }, [classId, student, tz]);

  const shown = (data?.reports ?? []).filter((r) => !onlyActive || r.totals.questions_30d > 0);
  const today = new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="min-h-screen bg-gray-100 text-black print:bg-white">
      <style>{"@media print { @page { size: letter; margin: 0.5in; } }"}</style>
      <div className="sticky top-0 z-10 border-b bg-white px-4 py-3 print:hidden">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-4">
          <p className="text-sm font-medium">{shown.length} summar{shown.length === 1 ? "y" : "ies"}</p>
          {!student && (
            <div className="flex items-center gap-2">
              <Switch id="active" checked={onlyActive} onCheckedChange={setOnlyActive} />
              <Label htmlFor="active" className="text-xs">Only students who practiced in the last 30 days</Label>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Switch id="tips" checked={withTips} onCheckedChange={setWithTips} />
            <Label htmlFor="tips" className="text-xs">Tips for home</Label>
          </div>
          <Button size="sm" className="ml-auto" onClick={() => window.print()} disabled={!shown.length}><Printer className="mr-2 h-4 w-4" /> Print</Button>
        </div>
        <p className="mx-auto mt-1 max-w-3xl text-xs text-gray-500">Type a personal note on any page before printing. Notes are not saved.</p>
      </div>

      {error && <p className="p-8 text-center text-red-700">{error}</p>}
      {!data && !error && <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}
      {data && !shown.length && <p className="p-8 text-center text-gray-600">No students to show.</p>}

      <div className="mx-auto max-w-3xl space-y-8 p-8 print:max-w-none print:space-y-0 print:p-0">
        {data && shown.map((r) => {
          const first = r.student.name.split(" ")[0];
          const gradeTopics = r.topics.filter((t) => t.section === r.student.grade);
          return (
            <section key={r.student.id} className="break-after-page space-y-5 bg-white p-10 text-[13px] leading-relaxed shadow print:p-0 print:shadow-none">
              <header className="flex items-end justify-between border-b-2 border-gray-800 pb-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Math Quest · Progress for families</p>
                  <h1 className="font-headline text-2xl font-bold">{r.student.name}</h1>
                </div>
                <p className="text-right text-xs text-gray-600">
                  {data.class_name}{r.student.grade ? ` · Grade ${r.student.grade}` : ""}<br />{today}
                </p>
              </header>

              <p>
                Dear family, here is how {first} is doing in Math Quest, the math practice program we use in class.
                It gives each student questions at the right level and keeps track of which skills they have mastered.
              </p>

              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  [r.totals.questions_30d, "questions practiced in the last 30 days"],
                  [r.totals.accuracy_30d === null ? "—" : `${r.totals.accuracy_30d}%`, "answered correctly"],
                  [r.totals.mastered, `skill${r.totals.mastered === 1 ? "" : "s"} mastered so far`],
                  [r.totals.minutes_30d, "minutes of practice"],
                ].map(([v, l]) => (
                  <div key={String(l)} className="rounded border border-gray-300 p-2">
                    <p className="text-xl font-bold">{v}</p>
                    <p className="text-[11px] leading-tight text-gray-600">{l}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h2 className="mb-1 font-semibold">Going well</h2>
                  {r.strengths.length ? (
                    <ul className="list-disc space-y-0.5 pl-5">{r.strengths.map((t) => <li key={`${t.section}${t.letter}`}>{t.title}</li>)}</ul>
                  ) : <p className="text-gray-600">{first} is still building up scores. Strengths will show here after more practice.</p>}
                </div>
                <div>
                  <h2 className="mb-1 font-semibold">Working on next</h2>
                  {r.focus.length ? (
                    <ul className="list-disc space-y-0.5 pl-5">{r.focus.map((t) => <li key={`${t.section}${t.letter}`}>{t.title}</li>)}</ul>
                  ) : <p className="text-gray-600">No topic needs extra attention right now.</p>}
                </div>
              </div>

              {gradeTopics.length > 0 && (
                <div>
                  <h2 className="mb-1 font-semibold">Grade {r.student.grade} topics so far</h2>
                  <table className="w-full border-collapse text-[12px]">
                    <tbody>
                      {gradeTopics.map((t) => (
                        <tr key={t.letter} className="border-b border-gray-200">
                          <td className="py-1 pr-2">{t.title}</td>
                          <td className="py-1 pr-2 text-gray-600">{t.core_mastered} of {t.core_total} skills mastered</td>
                          <td className="py-1 text-right font-medium">{level(t.score)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {r.mistakes.length > 0 && (
                <p>
                  <span className="font-semibold">A pattern to watch: </span>
                  {first} sometimes {r.mistakes[0].name.charAt(0).toLowerCase() + r.mistakes[0].name.slice(1)}.
                  Math Quest shows a short lesson on this each time it happens.
                </p>
              )}

              {r.totals.streak >= 2 && <p>{first} has a <strong>{r.totals.streak}-day</strong> practice streak. Please cheer them on!</p>}

              {withTips && (
                <div>
                  <h2 className="mb-1 font-semibold">How you can help at home</h2>
                  <ul className="list-disc space-y-0.5 pl-5">
                    {r.focus[0] && <li>Ask {first} to show you a problem about <em>{r.focus[0].title.toLowerCase()}</em> and talk through it together.</li>}
                    {HOME_TIPS.slice(0, r.focus[0] ? 4 : 5).map((t) => <li key={t}>{t}</li>)}
                  </ul>
                </div>
              )}

              <div>
                <h2 className="mb-1 font-semibold">Note from the teacher</h2>
                <Textarea rows={3} value={notes[r.student.id] ?? ""} placeholder="Optional personal note (prints as written)"
                  onChange={(e) => setNotes((n) => ({ ...n, [r.student.id]: e.target.value }))}
                  className="bg-white text-[13px] print:hidden" />
                <p className="hidden min-h-[4em] whitespace-pre-wrap border-b border-gray-300 print:block">{notes[r.student.id]}</p>
              </div>

              <footer className="flex items-end justify-between pt-4 text-xs text-gray-600">
                <p>Questions? Please contact {data.teacher_name ?? "your child's teacher"}.</p>
                <p className="w-48 border-t border-gray-400 pt-1 text-center">Parent signature</p>
              </footer>
            </section>
          );
        })}
      </div>
    </div>
  );
}
