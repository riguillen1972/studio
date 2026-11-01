"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { HIGHEST_LEVEL, LOWEST_LEVEL, RELATION_LABELS, levelLabel, levelShort, relationOf, type Placement } from "@/lib/quest/placement";

const LEVELS = Array.from({ length: HIGHEST_LEVEL - LOWEST_LEVEL + 1 }, (_, i) => LOWEST_LEVEL + i);

export const RELATION_STYLES = {
  above: "bg-sky-600 text-white",
  on: "bg-green-600 text-white",
  one_below: "bg-amber-500 text-black",
  two_below: "bg-red-500 text-white",
} as const;

/** The grade level a student works at in each strand: a ladder from below grade 5 to above grade 8. */
export function PlacementLadder({ placement, grade, previous, forTeacher = false }: {
  placement: Placement; grade: number; previous?: Placement | null; forTeacher?: boolean;
}) {
  const before = (strand: string) => previous?.strands.find((s) => s.strand === strand)?.level ?? null;
  const strands = placement.strands.filter((s) => s.level !== null);
  return (
    <div className="space-y-3">
      <div className="hidden grid-cols-[minmax(0,1fr)_repeat(6,2.25rem)_3rem] gap-1 text-center text-[10px] text-muted-foreground sm:grid">
        <span />
        {LEVELS.map((l) => <span key={l} className={l === grade ? "font-semibold text-foreground" : ""}>{l === grade ? `${levelShort(l)} ★` : levelShort(l)}</span>)}
        <span />
      </div>
      {strands.map((s) => {
        const was = before(s.strand);
        const change = was !== null && s.level !== null ? s.level - was : 0;
        return (
          <div key={s.strand} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 sm:grid-cols-[minmax(0,1fr)_repeat(6,2.25rem)_3rem] sm:gap-1">
            <span className="truncate text-sm">{s.name}</span>
            <span className="text-right text-xs font-medium sm:hidden">{levelLabel(s.level!)}</span>
            <div className="col-span-2 flex gap-1 sm:contents" role="img" aria-label={`${s.name}: ${levelLabel(s.level!)}${was !== null && change ? `, was ${levelLabel(was)}` : ""}`}>
              {LEVELS.map((l) => (
                <span key={l} title={levelLabel(l)}
                  className={`h-4 flex-1 rounded-sm sm:h-5 ${l <= s.level! ? RELATION_STYLES[relationOf(s.level!, grade)] : "bg-muted"} ${l === grade ? "ring-2 ring-foreground/40 ring-offset-1 ring-offset-background" : ""}`} />
              ))}
            </div>
            <span className="hidden items-center justify-end gap-0.5 text-xs sm:flex">
              {change > 0 && <><ArrowUp className="h-3 w-3 text-green-600" />{change}</>}
              {change < 0 && <><ArrowDown className="h-3 w-3 text-red-500" />{-change}</>}
            </span>
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground">
        {forTeacher
          ? "★ marks the student's grade. Filled boxes show the grade level they're working at in each strand; arrows show change since the first diagnostic."
          : "★ marks your grade. Filled boxes show the grade level you're working at in each area."}
      </p>
    </div>
  );
}

/** Headline placement: overall level, how it compares with the student's grade, and growth. */
export function PlacementSummary({ placement, grade, previous }: { placement: Placement; grade: number; previous?: Placement | null }) {
  if (placement.overall === null) return null;
  const relation = relationOf(placement.overall, grade);
  const growth = previous?.average != null && placement.average != null ? Math.round((placement.average - previous.average) * 10) / 10 : null;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className={`rounded-md px-2.5 py-1 text-sm font-semibold ${RELATION_STYLES[relation]}`}>{levelLabel(placement.overall)}</span>
      <span className="text-sm text-muted-foreground">{RELATION_LABELS[relation]} overall</span>
      {growth !== null && (
        <span className={`text-sm font-medium ${growth > 0 ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}`}>
          {growth > 0 ? `+${growth} grade levels of growth` : growth < 0 ? `${growth} grade levels since last time` : "Same as last time"}
        </span>
      )}
    </div>
  );
}
