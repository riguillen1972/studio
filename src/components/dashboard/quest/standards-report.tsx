"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import { downloadCsv, fileSlug } from "@/lib/csv";
import { openWorksheet } from "./question-bank";
import { BANDS, BandLegend, bandInfo } from "./band";
import type { QuestClassData } from "./quest-teacher";

/** Where the class stands on each NAD standard: one stacked bar of students per topic. */
export function StandardsReport({ data }: { data: QuestClassData }) {
  const grades = [...new Set(data.standards.map((s) => s.section))];
  const studentGrades = [...new Set(data.students.map((s) => s.grade))];
  const [grade, setGrade] = useState(grades.find((g) => studentGrades.includes(g)) ?? grades[0] ?? 6);
  const rows = data.standards.filter((s) => s.section === grade);
  const total = data.students.length;

  const exportCsv = () => downloadCsv(`${fileSlug(data.class.name)}-standards.csv`, [
    ["Grade", "Topic", "NAD standard", "Title", "Class average", "Proficient", "Developing", "Needs help", "Not started"],
    ...data.standards.map((s) => [s.section, s.letter, s.nad, s.title, s.average ?? "", s.proficient, s.developing, s.needs_help, s.no_data]),
  ]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Standards</CardTitle>
            <CardDescription>How many of your {total} students are proficient on each NAD standard, from their practice and diagnostic scores.</CardDescription>
          </div>
          <div className="flex gap-2 print:hidden">
            <Button size="sm" variant="outline" onClick={exportCsv}><Download className="mr-2 h-4 w-4" /> CSV</Button>
            <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 print:hidden">
            {grades.map((g) => (
              <Button key={g} size="sm" variant={g === grade ? "default" : "outline"} className="h-7" onClick={() => setGrade(g)}>Grade {g}</Button>
            ))}
          </div>
          <BandLegend withNoData />
        </div>

        <div className="divide-y">
          {rows.map((s) => {
            const counts = [...BANDS.map((b) => ({ ...b, n: s[b.id] })), { id: "none", label: "Not started", bar: "bg-muted", n: s.no_data }];
            const skillIds = data.all_skills.filter((k) => k.section === s.section && k.nad === s.nad && !k.advanced).map((k) => k.id);
            return (
              <div key={`${s.section}${s.letter}`} className="grid gap-2 py-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_auto] md:items-center md:gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium"><span className="text-muted-foreground">{s.letter}.</span> {s.title}</p>
                  <p className="text-xs text-muted-foreground">NAD {s.nad}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex h-3 gap-0.5 overflow-hidden rounded" role="img"
                    aria-label={counts.map((c) => `${c.n} ${c.label}`).join(", ")}>
                    {total > 0 && counts.filter((c) => c.n > 0).map((c) => (
                      <div key={c.id} className={`${c.bar} first:rounded-l last:rounded-r`} style={{ width: `${(c.n / total) * 100}%` }}
                        title={`${c.label}: ${c.n} of ${total} students`} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {s.proficient} proficient · {s.developing} developing · {s.needs_help} need help{s.no_data ? ` · ${s.no_data} not started` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 md:justify-end">
                  <span className={`text-sm font-semibold tabular-nums ${s.average === null ? "text-muted-foreground" : bandInfo(s.average).text}`}
                    title="Class average score on this standard">
                    {s.average === null ? "—" : s.average}
                  </span>
                  {(s.developing + s.needs_help > 0) && skillIds.length > 0 && (
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs print:hidden" title="Print a worksheet on this standard"
                      onClick={() => openWorksheet(skillIds, s.title)}>
                      <Printer className="mr-1 h-3.5 w-3.5" /> Worksheet
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {rows.every((s) => s.no_data === total) && (
          <p className="text-sm text-muted-foreground">No grade {grade} data yet. Scores appear once students take the diagnostic or practice.</p>
        )}
      </CardContent>
    </Card>
  );
}
