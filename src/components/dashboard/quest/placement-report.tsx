"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Download, Mountain } from "lucide-react";
import { downloadCsv, fileSlug } from "@/lib/csv";
import { RELATION_STYLES } from "@/components/quest/placement-card";
import { RELATION_LABELS, levelLabel, levelShort, relationOf, type Placement, type Relation } from "@/lib/quest/placement";
import { STRAND_NAMES, STRAND_ORDER } from "@/lib/quest/skills";
import type { QuestClassData } from "./quest-teacher";

const STRAND_SHORT: Record<string, string> = {
  numbers: "Num", fractions: "Frac", ratios: "Ratio", expressions: "Expr", equations: "Eq",
  functions: "Func", geometry: "Geo", measurement: "Meas", statistics: "Stats",
};
const RELATIONS: Relation[] = ["above", "on", "one_below", "two_below"];
const date = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

/** Diagnostic placement by strand for the whole class, check-in controls, and growth since the first diagnostic. */
export function PlacementReport({ data, onToggleCheckin }: { data: QuestClassData; onToggleCheckin: (open: boolean) => Promise<void> }) {
  const rows = data.placement;
  const placed = rows.filter((r) => r.latest?.overall != null);
  const counts = RELATIONS.map((rel) => ({ rel, n: placed.filter((r) => relationOf(r.latest!.overall!, r.grade) === rel).length }));
  const notTaken = rows.length - placed.length;
  const open = !!data.checkin_opened_at;
  const checkinDone = rows.filter((r) => r.checkin_done).length;
  const growths = rows.map(growthOf).filter((g): g is number => g !== null);
  const averageGrowth = growths.length ? Math.round((growths.reduce((a, b) => a + b, 0) / growths.length) * 10) / 10 : null;

  const exportCsv = () => downloadCsv(`${fileSlug(data.class.name)}-placement.csv`, [
    ["Student", "Grade", "Overall placement", "Compared with grade", ...STRAND_ORDER.map((s) => STRAND_NAMES[s]),
      "First average level", "Latest average level", "Growth (grade levels)", "Diagnostics taken", "Last taken"],
    ...rows.map((r) => {
      const p = r.latest;
      return [
        r.name, r.grade, p?.overall != null ? levelLabel(p.overall) : "", p?.overall != null ? RELATION_LABELS[relationOf(p.overall, r.grade)] : "",
        ...STRAND_ORDER.map((s) => { const l = p?.strands.find((x) => x.strand === s)?.level; return l != null ? levelLabel(l) : ""; }),
        r.first?.average ?? "", p?.average ?? "", growthOf(r) ?? "", r.rounds, p ? date(p.completed_at) : "",
      ];
    }),
  ]);

  return (
    <div className="space-y-4">
      <Card className={open ? "border-primary/40" : ""}>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base"><Mountain className="h-4 w-4 text-primary" /> Check-ins</CardTitle>
              <CardDescription>
                Reopen the diagnostic (for example in winter and spring) to measure growth. Students keep their practice progress.
              </CardDescription>
            </div>
            <Button size="sm" variant={open ? "outline" : "default"} onClick={() => onToggleCheckin(!open)}>
              {open ? "Close check-in" : "Open a check-in"}
            </Button>
          </div>
        </CardHeader>
        {open && (
          <CardContent className="pt-0 text-sm">
            Open since {date(data.checkin_opened_at!)} · <span className="font-medium">{checkinDone} of {rows.length}</span> students done
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Placement</CardTitle>
              <CardDescription>
                The grade level each student is working at in each strand, from their latest diagnostic or check-in.
                {averageGrowth !== null && <> Average growth since the first diagnostic: <span className="font-medium text-foreground">{averageGrowth > 0 ? "+" : ""}{averageGrowth} grade levels</span>.</>}
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={exportCsv} className="print:hidden"><Download className="mr-2 h-4 w-4" /> CSV</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex h-3 gap-0.5 overflow-hidden rounded" role="img" aria-label={[...counts.map((c) => `${c.n} ${RELATION_LABELS[c.rel]}`), `${notTaken} not taken`].join(", ")}>
                {counts.filter((c) => c.n).map((c) => (
                  <div key={c.rel} className={RELATION_STYLES[c.rel]} style={{ width: `${(c.n / rows.length) * 100}%` }} title={`${RELATION_LABELS[c.rel]}: ${c.n}`} />
                ))}
                {notTaken > 0 && <div className="bg-muted" style={{ width: `${(notTaken / rows.length) * 100}%` }} title={`No diagnostic yet: ${notTaken}`} />}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {counts.map((c) => <span key={c.rel} className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-sm ${RELATION_STYLES[c.rel]}`} />{RELATION_LABELS[c.rel]} ({c.n})</span>)}
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-muted" />No diagnostic yet ({notTaken})</span>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Student</th>
                  <th className="py-2 pr-3 font-medium">Overall</th>
                  {STRAND_ORDER.map((s) => <th key={s} className="px-0.5 py-2 text-center font-medium" title={STRAND_NAMES[s]}>{STRAND_SHORT[s]}</th>)}
                  <th className="py-2 pl-3 font-medium">Growth</th>
                  <th className="py-2 pl-3 font-medium">Last</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const p = r.latest;
                  const growth = growthOf(r);
                  return (
                    <tr key={r.student_id} className="border-b last:border-0">
                      <td className="py-1.5 pr-3"><span className="font-medium">{r.name}</span> <span className="text-xs text-muted-foreground">Gr {r.grade}</span></td>
                      <td className="py-1.5 pr-3">
                        {p?.overall != null
                          ? <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${RELATION_STYLES[relationOf(p.overall, r.grade)]}`}>{levelLabel(p.overall)}</span>
                          : <span className="text-xs text-muted-foreground">Not taken</span>}
                      </td>
                      {STRAND_ORDER.map((s) => <StrandCell key={s} placement={p} strand={s} grade={r.grade} first={r.first} />)}
                      <td className="py-1.5 pl-3 text-xs tabular-nums">
                        {growth === null ? <span className="text-muted-foreground">—</span>
                          : <span className={growth > 0 ? "font-medium text-green-700 dark:text-green-400" : growth < 0 ? "text-red-600 dark:text-red-400" : ""}>{growth > 0 ? "+" : ""}{growth}</span>}
                      </td>
                      <td className="whitespace-nowrap py-1.5 pl-3 text-xs text-muted-foreground">
                        {p ? date(p.completed_at) : "—"}
                        {r.checkin_done && <CheckCircle2 className="ml-1 inline h-3.5 w-3.5 text-green-600" aria-label="Check-in done" />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Levels: &lt;5 = below grade 5, 5 = grade 5 foundations, 6–8 = that grade, 8+ = grade 8 challenge skills. Growth is the change in average
            level across strands since the first diagnostic. A blank cell means the diagnostic didn&apos;t reach that strand.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

type PlacementRow = QuestClassData["placement"][number];

function growthOf(r: PlacementRow): number | null {
  if (r.first?.average == null || r.latest?.average == null) return null;
  return Math.round((r.latest.average - r.first.average) * 10) / 10;
}

function StrandCell({ placement, strand, grade, first }: { placement: Placement | null; strand: string; grade: number; first: Placement | null }) {
  const cell = placement?.strands.find((s) => s.strand === strand);
  const level = cell?.level ?? null;
  const was = first?.strands.find((s) => s.strand === strand)?.level ?? null;
  if (level === null) return <td className="px-0.5 py-1.5" />;
  return (
    <td className="px-0.5 py-1.5 text-center">
      <span className={`inline-block w-9 rounded px-1 py-0.5 text-xs font-semibold tabular-nums ${RELATION_STYLES[relationOf(level, grade)]}`}
        title={`${STRAND_NAMES[strand as keyof typeof STRAND_NAMES]}: ${cell?.completed ? "finished every level of this strand" : levelLabel(level)}${was !== null && was !== level ? ` (was ${levelLabel(was)})` : ""}`}>
        {levelShort(level)}{was !== null && was !== level ? (level > was ? "↑" : "↓") : ""}
      </span>
    </td>
  );
}
